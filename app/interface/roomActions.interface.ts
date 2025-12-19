import type { JoiningMode } from "./room.interface";

export interface RoomActionsProps {
  oncreateRoom: (ttl: number) => void;
  onjoinRoom: (roomId: string) => void;
  JoinMode?: JoiningMode;
  room: string;
}
