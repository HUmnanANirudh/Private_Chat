import type { ServerWebSocket } from "bun";
import { registry } from "../registry";
import type { wsData } from "../types";
import { getRoomMeta } from "../../../../packages/redis/rooms";

export const joinRoomHandler = async (ws: ServerWebSocket<wsData>, roomId: string) => {

  const roomData = await getRoomMeta(roomId);
  const token = ws.data.token;
  console.log("Joining room:", roomId, "with token:", token);
  if (Object.keys(roomData.meta).length === 0) {
    ws.send(JSON.stringify({
      type: "error",
      message: "Room not found"
    }));
    ws.close();
    return;
  }

  if (!roomData.participants.includes(token)) {
    ws.send(JSON.stringify({
      type: "error",
      message: "You are not a participant of this room"
    }));
    ws.close();
    return;
  }

  let room = registry.get(roomId);

  if (!room) {
    room = new Map();
    registry.set(roomId, room);
  }

  room.set(token, ws);

  ws.data = {
    roomId,
    token
  }

  ws.send(JSON.stringify({
    type: "joined",
    message: "Joined room successfully"
  }))

  if (room.size === 2) {
    for (const [, peer] of room) {
      peer.send(JSON.stringify({
        type: "ready"
      }));
    }
  }
}