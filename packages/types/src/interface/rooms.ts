export interface ChatRoomProps {
  roomId: string;
}

export interface LobbyProps {
  roomId?: string;
  onCreateRoom?: (ttl: number) => void;
  onJoinRoom?: (roomId: string) => void;
  JoiningMode?: JoiningMode;
}

export type JoiningMode = "idle" | "create" | "join";

export type SearchParams = {
  mode?: JoiningMode;
  room?: string;
};

export interface IdentityCardProps {
  onCreateRoom: (ttl: number) => void;
  onJoinRoom: (roomId: string) => void;
  roomId: string;
  JoiningMode?: JoiningMode;
}

export interface RoomActionsProps {
  oncreateRoom: (ttl: number) => void;
  onjoinRoom: (roomId: string) => void;
  JoinMode?: JoiningMode;
  room?: string;
}

export type ChatManagerState = "idle" | "connecting" | "waiting" | "connecting-to-peer" | "connected" | "disconnected";

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
  data: string;
  sender: string;
  timestamp: number;
}

export interface OverlayModalProps {
  title: string;
  description?: string;
  redirectTo?: string;
  seconds?: number;
}

export interface RoomDestroyedOverlayProps {
  isOpen: boolean;
}

export interface GeneralErrorModalProps {
  message?: string;
}

export interface RoomActionsIdleProps {
  setMode: (mode: "create" | "join") => void;
}

export interface RoomActionsCreateProps {
  oncreateRoom: (ttl: number) => void;
  setMode: (mode: "idle") => void;
}

export interface RoomActionsJoinProps {
  onjoinRoom: (roomId: string) => void;
  setMode: (mode: "idle") => void;
  initialRoomCode?: string;
}



