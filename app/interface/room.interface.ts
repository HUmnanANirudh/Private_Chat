export interface Room {
  roomId: string;
}

export interface CreateRoomRequest {
  ROOM_TTL_SECONDS: number;
}

export interface CreateRoomResponse {
  roomId: string;
}

export type JoiningMode = "create" | "join" | "idle";
