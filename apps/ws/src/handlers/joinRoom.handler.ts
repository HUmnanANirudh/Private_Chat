import type { ServerWebSocket } from "bun";
import { registry } from "../registry";
import type { wsData } from "@repo/types";
import { getRoomMeta, addParticipant } from "../../../../packages/redis/rooms";

export const joinRoomHandler = async (ws: ServerWebSocket<wsData>, roomId: string, tokenFromMessage?: string) => {

  const roomData = await getRoomMeta(roomId);
  const token = tokenFromMessage || ws.data.token;
  console.log("Joining room:", roomId, "with token:", token);
  if (Object.keys(roomData.meta).length === 0) {
    ws.send(JSON.stringify({
      type: "error",
      message: "Room not found"
    }));
    ws.close();
    return;
  }

  let currentParticipants = roomData.participants;
  if (!roomData.participants.includes(token) && roomData.participants.length < 2) {
    await addParticipant(roomId, token);
    const updatedRoomData = await getRoomMeta(roomId);
    currentParticipants = updatedRoomData.participants;
    console.log("Participant added", token, "participants:", currentParticipants);
  }

  if (!currentParticipants.includes(token)) {
    ws.send(JSON.stringify({
      type: "error",
      message: "Room is full"
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
    let index = 0;
    for (const [, peer] of room) {
      peer.send(JSON.stringify({
        type: "ready",
        initiator: index === 0
      }));
      index++;
    }
  }
}