import type { JoiningMode } from "./room.interface";

export interface LobbyProps {
  roomId?: string;
  JoiningMode?: JoiningMode;
  onCreateRoom?: (ttl: number) => void;
  onJoinRoom?: (roomId: string) => void;
}
