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

export interface FileChunkMessage {
  type: "file-chunk";
  id: string;
  chunkIndex: number;
  totalChunks: number;
  data: string;
  name: string;
  size: number;
  mimeType: string;
  sender: string;
  timestamp: number;
}

export type DataChannelMessage = TextMessage | FileMessage | FileChunkMessage;

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
  startMedia: () => Promise<void>;
  muteAudio: () => void;
  unmuteAudio: () => void;
  toggleVideo: () => void;
  isAudioMuted: () => boolean;
  isVideoEnabled: () => boolean;

  // Data channel
  sendTextMessage: (content: string, sender: string) => boolean;
  sendFile: (file: File, sender: string) => Promise<boolean>;
  createDataChannel: (label: string) => RTCDataChannel;

  // Event callbacks
  onIceCandidate: ((candidate: RTCIceCandidate) => void) | null;
  onRemoteStream: ((stream: MediaStream) => void) | null;
  onConnectionStateChange: ((state: PeerConnectionState) => void) | null;
  onDataChannelMessage: ((message: DataChannelMessage) => void) | null;
  onDataChannelStateChange: ((state: string) => void) | null;
  onNegotiationNeeded: (() => void) | null;
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
  let onNegotiationNeededCallback: (() => void) | null = null;
  
  const fileBuffers = new Map<string, string[]>();

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
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "file-chunk") {
          const chunkMsg = message as FileChunkMessage;
          if (!fileBuffers.has(chunkMsg.id)) {
            fileBuffers.set(chunkMsg.id, new Array(chunkMsg.totalChunks));
          }
          const buffer = fileBuffers.get(chunkMsg.id)!;
          buffer[chunkMsg.chunkIndex] = chunkMsg.data;

          // Check if complete
          let complete = true;
          for (let i = 0; i < chunkMsg.totalChunks; i++) {
            if (buffer[i] === undefined) { 
              complete = false; 
              break; 
            }
          }

          if (complete) {
            const fullBase64 = buffer.join("");
            fileBuffers.delete(chunkMsg.id);
            
            const fileMessage: FileMessage = {
              type: "file",
              id: chunkMsg.id,
              name: chunkMsg.name,
              size: chunkMsg.size,
              mimeType: chunkMsg.mimeType,
              data: fullBase64,
              sender: chunkMsg.sender,
              timestamp: chunkMsg.timestamp
            };
            onDataChannelMessageCallback?.(fileMessage);
          }
        } else {
          onDataChannelMessageCallback?.(message as DataChannelMessage);
        }
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
    get onNegotiationNeeded() { return onNegotiationNeededCallback; },
    set onNegotiationNeeded(cb) { onNegotiationNeededCallback = cb; },

    async initialize() {
      console.log("[WebRTC] Initializing...");

      // 1. Create RTCPeerConnection with STUN servers
      peerConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
      });

      console.log("[WebRTC] PeerConnection created");

      peerConnection.onnegotiationneeded = () => {
        console.log("[WebRTC] Negotiation needed");
        onNegotiationNeededCallback?.();
      };

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
      if (!dataChannel) {
        dataChannel = peerConnection.createDataChannel("chat");
        setupDataChannel(dataChannel);
      }

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

    async startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStream = stream;
        
        stream.getTracks().forEach((track) => {
          if (peerConnection) {
            peerConnection.addTrack(track, stream);
          }
        });
        console.log("[WebRTC] Media started and tracks added");
      } catch (err) {
        console.error("[WebRTC] Failed to get user media:", err);
      }
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
        return false;
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

    async sendFile(file: File, sender: string): Promise<boolean> {
      if (!dataChannel || dataChannel.readyState !== "open") {
        console.error("[WebRTC] Data channel not ready for file transfer");
        return false;
      }

      console.log("[WebRTC] Sending file:", file.name, file.size, "bytes");

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          const id = crypto.randomUUID();
          const timestamp = Date.now();
          const CHUNK_SIZE = 16384; // 16KB per chunk
          const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);
          
          const sendChunks = async () => {
            try {
              for (let i = 0; i < totalChunks; i++) {
                while (dataChannel && dataChannel.bufferedAmount > 65535) {
                  await new Promise(r => setTimeout(r, 50));
                }
                
                if (!dataChannel || dataChannel.readyState !== "open") {
                  throw new Error("Data channel closed during file transfer");
                }

                const chunkData = base64.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                const chunkMsg: FileChunkMessage = {
                  type: "file-chunk",
                  id,
                  chunkIndex: i,
                  totalChunks,
                  data: chunkData,
                  name: file.name,
                  size: file.size,
                  mimeType: file.type,
                  sender,
                  timestamp
                };
                dataChannel.send(JSON.stringify(chunkMsg));
              }
              console.log("[WebRTC] Sent file message:", file.name);
              resolve(true);
            } catch (err) {
              console.error("[WebRTC] Chunk send error:", err);
              resolve(false);
            }
          };
          
          sendChunks();
        };
        reader.onerror = () => resolve(false);
        reader.readAsDataURL(file);
      });
    },
  };
}