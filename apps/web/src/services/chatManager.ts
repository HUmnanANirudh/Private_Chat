import { createWebRTCService } from "./webrtc";
import type { WebRTCService, TextMessage, FileMessage } from "./webrtc";
import { createSignalingService } from "./signaling";
import type { SignalingService } from "./signaling";

export type ChatManagerState = "idle" | "connecting" | "waiting" | "connecting-to-peer" | "connected" | "disconnected";

export interface ChatManagerCallbacks {
  onStateChange?: (state: ChatManagerState) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  onPeerDisconnected?: () => void;
  onTextMessage?: (message: TextMessage) => void;
  onFileMessage?: (message: FileMessage) => void;
  onDataChannelOpen?: () => void;
}

export interface ChatManager {
  state: ChatManagerState;
  webrtc: WebRTCService;
  signaling: SignalingService;

  joinRoom: (roomId: string, token: string) => Promise<void>;
  leaveRoom: () => void;
  sendTextMessage: (content: string, sender: string) => boolean;
  sendFile: (file: File, sender: string) => Promise<boolean>;
  startMedia: () => Promise<void>;
  muteAudio: () => void;
  unmuteAudio: () => void;
  toggleVideo: () => void;
  isAudioMuted: () => boolean;
  isVideoEnabled: () => boolean;
}

export function createChatManager(callbacks: ChatManagerCallbacks): ChatManager {
  const webrtc = createWebRTCService();
  const signaling = createSignalingService({
    onReady: (isInitiator) => {
      console.log("[ChatManager] onReady - Both peers joined, starting WebRTC...", isInitiator ? "as initiator" : "as receiver");
      // If we're the first to join (initiator), create the offer
      if (isInitiator) {
        startConnection();
      }
    },
    onOffer: async (data) => {
      console.log("[ChatManager] onOffer - Received offer, creating answer...");
      try {
        await webrtc.createAnswer(data.offer);
        const answer = webrtc.peerConnection?.localDescription;
        if (answer) {
          signaling.sendAnswer(answer, data.from);
          console.log("[ChatManager] Sent answer");
        }
      } catch (err) {
        console.error("[ChatManager] Error creating answer:", err);
        callbacks.onError?.("Failed to create answer");
      }
    },
    onAnswer: async (data) => {
      console.log("[ChatManager] onAnswer - Received answer");
      try {
        if (webrtc.peerConnection?.signalingState === "have-local-offer") {
          console.log("[ChatManager] We are offer-creator, setting remote description from answer");
          await webrtc.peerConnection.setRemoteDescription(data.answer);
          console.log("[ChatManager] Remote description set from answer");
        } else {
          console.log("[ChatManager] Ignoring answer, signalingState is", webrtc.peerConnection?.signalingState);
        }
      } catch (err) {
        console.error("[ChatManager] Error setting remote description:", err);
        callbacks.onError?.("Failed to set remote description");
      }
    },
    onIceCandidate: async (data) => {
      console.log("[ChatManager] onIceCandidate - Adding remote ICE candidate...");
      try {
        await webrtc.addIceCandidate(data.candidate);
      } catch (err) {
        console.error("[ChatManager] Error adding ICE candidate:", err);
      }
    },
    onPeerDisconnected: () => {
      console.log("[ChatManager] Peer disconnected");
      callbacks.onPeerDisconnected?.();
    },
    onError: (error) => {
      console.error("[ChatManager] Signaling error:", error);
      callbacks.onError?.(error);
    },
  });

  let state: ChatManagerState = "idle";
  let currentRoomId: string | null = null;
  let currentToken: string | null = null;

  const setState = (newState: ChatManagerState) => {
    console.log(`[ChatManager] State: ${state} -> ${newState}`);
    state = newState;
    callbacks.onStateChange?.(newState);
  };

  const startConnection = async () => {
    if (state !== "connected") {
      setState("connecting-to-peer");
    }
    try {
      const offer = await webrtc.createOffer();
      signaling.sendOffer(offer, ""); // "" means send to the other peer
      console.log("[ChatManager] Sent offer");
    } catch (err) {
      console.error("[ChatManager] Error creating offer:", err);
      callbacks.onError?.("Failed to create offer");
    }
  };

  // Wire up WebRTC callbacks to forwarding through signaling
  webrtc.onIceCandidate = (candidate) => {
    console.log("[ChatManager] ICE candidate generated, sending via signaling...");
    signaling.sendIceCandidate(candidate.toJSON(), "");
  };

  webrtc.onConnectionStateChange = (connectionState) => {
    console.log("[ChatManager] WebRTC connection state:", connectionState);
    if (connectionState === "connected") {
      setState("connected");
    } else if (connectionState === "disconnected" || connectionState === "failed" || connectionState === "closed") {
      setState("disconnected");
    }
  };

  webrtc.onRemoteStream = (stream) => {
    console.log("[ChatManager] Remote stream received");
    callbacks.onRemoteStream?.(stream);
  };

  let isNegotiating = false;
  let pendingRenegotiation = false;

  const tryRenegotiate = async () => {
    if (state === "idle" || state === "waiting" || state === "connecting") return;
    if (isNegotiating || webrtc.peerConnection?.signalingState !== "stable") {
      pendingRenegotiation = true;
      return;
    }

    try {
      isNegotiating = true;
      console.log("[ChatManager] Executing renegotiation...");
      await startConnection();
    } finally {
      isNegotiating = false;
      if (pendingRenegotiation && webrtc.peerConnection?.signalingState === "stable") {
        pendingRenegotiation = false;
        tryRenegotiate();
      }
    }
  };

  webrtc.onNegotiationNeeded = async () => {
    tryRenegotiate();
  };

  // Set up data channel message handler
  webrtc.onDataChannelMessage = (message) => {
    if (message.type === "text") {
      console.log("[ChatManager] Forwarding text message to UI:", message.content);
      callbacks.onTextMessage?.(message);
    } else if (message.type === "file") {
      callbacks.onFileMessage?.(message);
    }
  };

  webrtc.onDataChannelStateChange = (dataChannelState) => {
    console.log("[ChatManager] Data channel state changed:", dataChannelState);
    if (dataChannelState === "open") {
      callbacks.onDataChannelOpen?.();
    }
  };

  webrtc.onSignalingStateChange = (sigState) => {
    if (sigState === "stable" && pendingRenegotiation) {
      pendingRenegotiation = false;
      tryRenegotiate();
    }
  };

  return {
    get state() {
      return state;
    },
    webrtc,
    signaling,

    async joinRoom(roomId: string, token: string) {
      console.log(`[ChatManager] Joining room: ${roomId}`);
      setState("connecting");
      currentRoomId = roomId;
      currentToken = token;

      try {
        // Initialize WebRTC first (gets media + creates peer connection)
        await webrtc.initialize();

        // Get local stream and pass it to callbacks
        const localStream = webrtc.getLocalStream();
        if (localStream) {
          callbacks.onLocalStream?.(localStream);
        }

        // Connect signaling (this joins the room via WebSocket)
        signaling.connect(roomId, token);
        setState("waiting");
      } catch (err) {
        console.error("[ChatManager] Error joining room:", err);
        setState("idle");
        callbacks.onError?.("Failed to join room");
        throw err;
      }
    },

    leaveRoom() {
      console.log("[ChatManager] Leaving room");
      signaling.sendPeerDisconnect(currentRoomId ?? "", currentToken ?? "");
      signaling.disconnect();
      webrtc.cleanup();
      setState("idle");
      currentRoomId = null;
      currentToken = null;
    },

    sendTextMessage(content: string, sender: string) {
      return webrtc.sendTextMessage(content, sender);
    },

    async sendFile(file: File, sender: string) {
      return await webrtc.sendFile(file, sender);
    },

    async startMedia() {
      await webrtc.startMedia();
      const localStream = webrtc.getLocalStream();
      if (localStream) {
        callbacks.onLocalStream?.(localStream);
      }
    },

    muteAudio() {
      webrtc.muteAudio();
    },

    unmuteAudio() {
      webrtc.unmuteAudio();
    },

    toggleVideo() {
      webrtc.toggleVideo();
    },

    isAudioMuted() {
      return webrtc.isAudioMuted();
    },

    isVideoEnabled() {
      return webrtc.isVideoEnabled();
    },
  };
}