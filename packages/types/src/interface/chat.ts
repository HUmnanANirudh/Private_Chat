import type { TextMessage, FileMessage, ChatManagerState } from "./rooms";

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  isOwn: boolean;
  isFile?: boolean;
  isSending?: boolean;
  fileData?: string;
  fileName?: string;
  mimeType?: string;
}

export type PeerConnectionState = "new" | "connecting" | "connected" | "disconnected" | "failed" | "closed";

export type DataChannelMessageType = "text" | "file";

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
  peerConnection: RTCPeerConnection | null;
  connectionState: PeerConnectionState;
  dataChannel: RTCDataChannel | null;
  dataChannelState: string;

  initialize: () => Promise<void>;
  cleanup: () => void;

  createOffer: () => Promise<RTCSessionDescriptionInit>;
  createAnswer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;

  sendTextMessage: (content: string, sender: string) => boolean;
  sendFile: (file: File, sender: string) => Promise<boolean>;
  createDataChannel: (label: string) => RTCDataChannel;

  onIceCandidate: ((candidate: RTCIceCandidate) => void) | null;
  onConnectionStateChange: ((state: PeerConnectionState) => void) | null;
  onSignalingStateChange: ((state: RTCSignalingState) => void) | null;
  onDataChannelMessage: ((message: DataChannelMessage) => void) | null;
  onDataChannelStateChange: ((state: string) => void) | null;
  onNegotiationNeeded: (() => void) | null;
  resetConnection: () => void;
}



export interface SignalingCallbacks {
  onPeerJoined?: (data: { token: string }) => void;
  onReady?: (isInitiator: boolean) => void;
  onOffer?: (data: { offer: RTCSessionDescriptionInit; from: string }) => void;
  onAnswer?: (data: { answer: RTCSessionDescriptionInit; from: string }) => void;
  onIceCandidate?: (data: { candidate: RTCIceCandidateInit; from: string }) => void;
  onPeerDisconnected?: (data: { token: string }) => void;
  onError?: (error: string) => void;
}

export interface SignalingService {
  isConnected: boolean;

  connect: (roomId: string, token: string) => void;
  disconnect: () => void;

  sendOffer: (offer: RTCSessionDescriptionInit, to: string) => void;
  sendAnswer: (answer: RTCSessionDescriptionInit, to: string) => void;
  sendIceCandidate: (candidate: RTCIceCandidateInit, to: string) => void;
  sendPeerDisconnect: (roomId: string, token: string) => void;
}



export interface ChatManagerCallbacks {
  onStateChange?: (state: ChatManagerState) => void;
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
}

export interface ChatHeaderProps {
  dataChannelReady: boolean;
  expiresAt: number | null;
  timeRemaining: number | null;
  formatTime: (ms: number) => string;
  handleCopy: () => void;
  isCopied: boolean;
  destroyRoom: () => void;
  inviteUrl: string;
  roomCode: string;
}

export interface MessageListProps {
  messages: Message[];
  dataChannelReady: boolean;
  chatState: ChatManagerState;
  messagesEndRef: { readonly current: HTMLDivElement | null } | any;
}

export interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  dataChannelReady: boolean;
  fileInputRef: { readonly current: HTMLInputElement | null } | any;
  handleFileChange: (e: any) => void;
  handleSendMessage: () => void;
}

export interface UseChatManagerConnectionProps {
  roomId: string;
  username: string;
  isVerifying: boolean;
  ensureToken: () => Promise<string | null>;
  handleRoomDestroyed: () => void;
  setMessages: (update: Message[] | ((prev: Message[]) => Message[])) => void;
}

export interface UseSendFileProps {
  username: string;
  chatManagerRef: { readonly current: ChatManager | null } | any;
  setMessages: (update: Message[] | ((prev: Message[]) => Message[])) => void;
}

export interface UseSendTextMessageProps {
  username: string;
  input: string;
  setInput: (value: string) => void;
  chatManagerRef: { readonly current: ChatManager | null } | any;
  setMessages: (update: Message[] | ((prev: Message[]) => Message[])) => void;
}

export interface UseDestroyRoomProps {
  roomId: string;
  chatManagerRef: { readonly current: ChatManager | null } | any;
  handleRoomDestroyed: () => void;
}

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}


export interface AttachmentMenuProps {
  disabled: boolean;
  onFileChange: (e: any) => void;
}