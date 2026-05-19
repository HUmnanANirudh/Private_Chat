import z from "zod";

export const createRoom = z.object({
  ttlminutes: z
    .number()
    .int()
    .positive("ttlminutes must be a positive integer")
    .min(1, "ttlminutes must be at least 1")
    .max(1440, "ttlminutes cannot exceed 1440 (24 hours)"),
});

const destroyRoom = z.object({
  roomId: z.string("roomId is required").min(1),
});

const getRoomData = z.object({
  roomId: z.string("roomId is required").min(1),
});

const joinRoom = z.object({
  roomId: z.string("roomId is required").min(1),
});

export const roomValidation = {
  "/room/create": { POST: createRoom },
  "/room/join": { GET: joinRoom },
  "/room": { GET: getRoomData, DELETE: destroyRoom },
};

// Component Props Interfaces
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

// ChatManager state type
export type ChatManagerState = "idle" | "connecting" | "waiting" | "connecting-to-peer" | "connected" | "disconnected";

// Data channel message types
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
