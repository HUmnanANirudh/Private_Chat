// WebRTC Service - Handles peer-to-peer connections
// This service creates and manages the RTCPeerConnection

// STUN servers for NAT traversal
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export type PeerConnectionState = "new" | "connecting" | "connected" | "disconnected" | "failed" | "closed";

// Data channel message types
export type DataChannelMessageType = "text" | "file";

export interface TextMessage {
  type: "text";
  id: string;
  content: string;
  sender: string;
  timestamp: number;
}

export interface FileMessage {
  type: "file";
  id: string;
  name: string;
  size: number;
  mimeType: string;
  data: string; // base64 encoded
  sender: string;
  timestamp: number;
}

export type DataChannelMessage = TextMessage | FileMessage;

export interface WebRTCService {
  // Connection state
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: PeerConnectionState;
  dataChannel: RTCDataChannel | null;
  dataChannelState: string;

  // Initialization
  initialize: () => Promise<void>;
  cleanup: () => void;

  // Signaling helpers
  createOffer: () => Promise<RTCSessionDescriptionInit>;
  createAnswer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;

  // Stream management
  getLocalStream: () => MediaStream | null;
  getRemoteStream: () => MediaStream | null;

  // Media controls
  muteAudio: () => void;
  unmuteAudio: () => void;
  toggleVideo: () => void;
  isAudioMuted: () => boolean;
  isVideoEnabled: () => boolean;

  // Data channel
  sendTextMessage: (content: string, sender: string) => boolean;
  sendFile: (file: File, sender: string) => boolean;
  createDataChannel: (label: string) => RTCDataChannel;

  // Event callbacks
  onIceCandidate: ((candidate: RTCIceCandidate) => void) | null;
  onRemoteStream: ((stream: MediaStream) => void) | null;
  onConnectionStateChange: ((state: PeerConnectionState) => void) | null;
  onDataChannelMessage: ((message: DataChannelMessage) => void) | null;
  onDataChannelStateChange: ((state: string) => void) | null;
}

export function createWebRTCService(): WebRTCService {
  let peerConnection: RTCPeerConnection | null = null;
  let localStream: MediaStream | null = null;
  let remoteStream: MediaStream | null = null;
  let connectionState: PeerConnectionState = "new";
  let dataChannel: RTCDataChannel | null = null;
  let dataChannelState = "new";
  let audioMuted = false;
  let videoEnabled = true;

  // Callbacks (stored in closure, not on the returned object)
  let onIceCandidateCallback: ((candidate: RTCIceCandidate) => void) | null = null;
  let onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  let onConnectionStateChangeCallback: ((state: PeerConnectionState) => void) | null = null;
  let onDataChannelMessageCallback: ((message: DataChannelMessage) => void) | null = null;
  let onDataChannelStateChangeCallback: ((state: string) => void) | null = null;

  // Helper to set up data channel event handlers
  function setupDataChannel(channel: RTCDataChannel) {
    console.log("[WebRTC] Setting up data channel:", channel.label, "readyState:", channel.readyState);

    // Set initial state
    dataChannelState = channel.readyState === "open" ? "open" : "connecting";

    channel.onopen = () => {
      dataChannelState = "open";
      console.log("[WebRTC] Data channel OPENED!");
      onDataChannelStateChangeCallback?.("open");
    };

    channel.onclose = () => {
      dataChannelState = "closed";
      console.log("[WebRTC] Data channel closed");
      onDataChannelStateChangeCallback?.("closed");
    };

    channel.onmessage = (event) => {
      console.log("[WebRTC] Data channel onmessage received, data:", event.data);
      try {
        const message = JSON.parse(event.data) as DataChannelMessage;
        console.log("[WebRTC] Parsed message:", message);
        onDataChannelMessageCallback?.(message);
      } catch (err) {
        console.error("[WebRTC] Failed to parse data channel message:", err);
      }
    };

    channel.onerror = (error) => {
      console.error("[WebRTC] Data channel error:", error);
      dataChannelState = "error";
    };

    dataChannelState = channel.readyState;

    // If channel is already open when we set up handlers, call onopen immediately
    if (channel.readyState === "open") {
      console.log("[WebRTC] Data channel already open on setup!");
      dataChannelState = "open";
      onDataChannelStateChangeCallback?.("open");
    }

    console.log("[WebRTC] Data channel setup complete, current state:", channel.readyState);
  }

  return {
    get peerConnection() { return peerConnection; },
    get localStream() { return localStream; },
    get remoteStream() { return remoteStream; },
    get connectionState() { return connectionState; },
    get dataChannel() { return dataChannel; },
    get dataChannelState() { return dataChannelState; },

    get onIceCandidate() { return onIceCandidateCallback; },
    set onIceCandidate(cb) { onIceCandidateCallback = cb; },
    get onRemoteStream() { return onRemoteStreamCallback; },
    set onRemoteStream(cb) { onRemoteStreamCallback = cb; },
    get onConnectionStateChange() { return onConnectionStateChangeCallback; },
    set onConnectionStateChange(cb) { onConnectionStateChangeCallback = cb; },
    get onDataChannelMessage() { return onDataChannelMessageCallback; },
    set onDataChannelMessage(cb) { onDataChannelMessageCallback = cb; },
    get onDataChannelStateChange() { return onDataChannelStateChangeCallback; },
    set onDataChannelStateChange(cb) { onDataChannelStateChangeCallback = cb; },

    async initialize() {
      console.log("[WebRTC] Initializing...");

      // 1. Try to get user media (camera + microphone)
      // If no media devices available, we can still do signaling-only
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log("[WebRTC] Local stream acquired");
      } catch (err) {
        console.warn("[WebRTC] Failed to get user media, continuing without cam/mic:", err);
      }

      // 2. Create RTCPeerConnection with STUN servers
      peerConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
      });

      console.log("[WebRTC] PeerConnection created");

      // 3. Add local tracks to connection only if we have a local stream
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          if (peerConnection && localStream) {
            peerConnection.addTrack(track, localStream);
            console.log(`[WebRTC] Added ${track.kind} track to connection`);
          }
        });
      } else {
        console.log("[WebRTC] No local stream, skipping track addition");
      }

      // 4. Set up ICE candidate handler
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("[WebRTC] ICE candidate generated:", event.candidate);
          onIceCandidateCallback?.(event.candidate);
        }
      };

      // 5. Set up connection state handler
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection) {
          connectionState = peerConnection.connectionState;
          console.log("[WebRTC] >>> Connection state changed to:", connectionState);
          onConnectionStateChangeCallback?.(connectionState);
        }
      };

      // 6. Set up ICE connection state handler (more reliable for data channel)
      peerConnection.oniceconnectionstatechange = () => {
        console.log("[WebRTC] ICE connection state:", peerConnection?.iceConnectionState);
        if (peerConnection?.iceConnectionState === "connected" || peerConnection?.iceConnectionState === "completed") {
          console.log("[WebRTC] ICE connected! Data channel should open soon...");
        }
      };

      // 6. Set up remote stream handler
      peerConnection.ontrack = (event) => {
        console.log("[WebRTC] Remote track received:", event.streams[0]);
        remoteStream = event.streams[0];
        onRemoteStreamCallback?.(event.streams[0]);
      };

      // 7. Set up data channel handler (for receiving)
      peerConnection.ondatachannel = (event) => {
        console.log("[WebRTC] Data channel RECEIVED from peer:", event.channel.label, "state:", event.channel.readyState);
        dataChannel = event.channel;
        setupDataChannel(dataChannel);
        console.log("[WebRTC] After setupDataChannel, dataChannel state:", dataChannel.readyState);
      };
    },

    cleanup() {
      console.log("[WebRTC] Cleaning up...");

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
      }

      if (dataChannel) {
        dataChannel.close();
        dataChannel = null;
      }

      if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
      }

      remoteStream = null;
      connectionState = "closed";
      dataChannelState = "closed";
      console.log("[WebRTC] Cleanup complete");
    },

    async createOffer() {
      if (!peerConnection) {
        throw new Error("PeerConnection not initialized");
      }

      console.log("[WebRTC] Creating offer...");

      // Create data channel first (will be negotiated with offer)
      dataChannel = peerConnection.createDataChannel("chat");
      setupDataChannel(dataChannel);

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log("[WebRTC] Offer created and set as local description");

      return offer;
    },

    async createAnswer(offer: RTCSessionDescriptionInit) {
      if (!peerConnection) {
        throw new Error("PeerConnection not initialized");
      }

      console.log("[WebRTC] Creating answer...");
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      console.log("[WebRTC] Answer created and set as local description");

      return answer;
    },

    async addIceCandidate(candidate: RTCIceCandidateInit) {
      if (!peerConnection) {
        throw new Error("PeerConnection not initialized");
      }

      console.log("[WebRTC] Adding ICE candidate...");
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("[WebRTC] ICE candidate added");
    },

    createDataChannel(label: string) {
      if (!peerConnection) {
        throw new Error("PeerConnection not initialized");
      }

      console.log("[WebRTC] Creating data channel:", label);
      dataChannel = peerConnection.createDataChannel(label);
      setupDataChannel(dataChannel);
      return dataChannel;
    },

    getLocalStream() {
      return localStream;
    },

    getRemoteStream() {
      return remoteStream;
    },

    muteAudio() {
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = false;
          audioMuted = true;
          console.log("[WebRTC] Audio muted");
        });
      }
    },

    unmuteAudio() {
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = true;
          audioMuted = false;
          console.log("[WebRTC] Audio unmuted");
        });
      }
    },

    toggleVideo() {
      if (localStream) {
        localStream.getVideoTracks().forEach((track) => {
          track.enabled = !track.enabled;
          videoEnabled = track.enabled;
          console.log("[WebRTC] Video enabled:", track.enabled);
        });
      }
    },

    isAudioMuted() {
      return audioMuted;
    },

    isVideoEnabled() {
      return videoEnabled;
    },

    sendTextMessage(content: string, sender: string) {
      if (!dataChannel) {
        console.error("[WebRTC] Data channel not initialized");
        return false;
      }
      if (dataChannel.readyState !== "open") {
        console.warn("[WebRTC] Data channel not open yet, state:", dataChannel.readyState);
        // Queue or store message temporarily?
        // For now, let's try anyway
        try {
          const message: TextMessage = {
            type: "text",
            id: crypto.randomUUID(),
            content,
            sender,
            timestamp: Date.now(),
          };
          dataChannel.send(JSON.stringify(message));
          console.log("[WebRTC] Sent text message:", content);
          return true;
        } catch (e) {
          console.error("[WebRTC] Failed to send via data channel:", e);
          return false;
        }
      }

      const message: TextMessage = {
        type: "text",
        id: crypto.randomUUID(),
        content,
        sender,
        timestamp: Date.now(),
      };

      dataChannel.send(JSON.stringify(message));
      console.log("[WebRTC] Sent text message:", content);
      return true;
    },

    sendFile(file: File, sender: string) {
      if (!dataChannel || dataChannel.readyState !== "open") {
        console.error("[WebRTC] Data channel not ready for file transfer");
        return false;
      }

      console.log("[WebRTC] Sending file:", file.name, file.size, "bytes");

      // Read file as base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const fileMessage: FileMessage = {
          type: "file",
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          mimeType: file.type,
          data: base64.split(",")[1], // Remove data URL prefix
          sender,
          timestamp: Date.now(),
        };

        dataChannel?.send(JSON.stringify(fileMessage));
        console.log("[WebRTC] Sent file message:", file.name);
      };
      reader.readAsDataURL(file);

      return true;
    },
  };
}