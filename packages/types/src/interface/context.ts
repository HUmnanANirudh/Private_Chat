import type { 
  PeerConnectionState, 
  DataChannelMessage, 
  SignalingCallbacks, 
  WebRTCService, 
  SignalingService, 
  ChatManagerCallbacks 
} from "./chat";
import type { ChatManagerState } from "./rooms";

export interface WebRTCContext {
  peerConnection: RTCPeerConnection | null;
  connectionState: PeerConnectionState;
  dataChannel: RTCDataChannel | null;
  dataChannelState: string;
  onIceCandidate: ((candidate: RTCIceCandidate) => void) | null;
  onConnectionStateChange: ((state: PeerConnectionState) => void) | null;
  onSignalingStateChange: ((state: RTCSignalingState) => void) | null;
  onDataChannelMessage: ((message: DataChannelMessage) => void) | null;
  onDataChannelStateChange: ((state: string) => void) | null;
  onNegotiationNeeded: (() => void) | null;
  fileBuffers: Map<string, { chunks: Uint8Array[], receivedSize: number }>;
  fileMetadata: Map<string, any>;
}

export interface SignalingContext {
  ws: WebSocket | null;
  isConnected: boolean;
  callbacks: SignalingCallbacks;
}

export interface ChatManagerContext {
  state: ChatManagerState;
  currentRoomId: string | null;
  currentToken: string | null;
  isNegotiating: boolean;
  pendingRenegotiation: boolean;
  webrtc: WebRTCService;
  signaling: SignalingService;
  callbacks: ChatManagerCallbacks;
  setState: (newState: ChatManagerState) => void;
  startConnection: () => Promise<void>;
  tryRenegotiate: () => Promise<void>;
}
