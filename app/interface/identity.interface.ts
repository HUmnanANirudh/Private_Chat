import type { JoiningMode } from "./room.interface";

export interface IdentityCardProps {
  onCreateRoom: (ttl: number) => void;
  onJoinRoom: (roomId: string) => void;
  roomId: string;
  JoiningMode?: JoiningMode;
}
