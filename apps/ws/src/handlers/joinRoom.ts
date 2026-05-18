import type { ServerWebSocket } from "bun";
import { registry } from "../registry";
import type { wsData } from "../types";
import { getRoomMeta } from "../../../../packages/redis";
export const joinRoomHandler = async (ws: ServerWebSocket<wsData>,roomId:string,token:string) =>{
    let room = registry.get(roomId);
    const existingRoom = await getRoomMeta(String(roomId));
    if (Object.keys(existingRoom.meta || {}).length === 0 ) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Room not found",
        }));
        ws.close();
        return;
    }
    if (existingRoom.participants.includes(String(token))) {
      ws.send(JSON.stringify({
        type: "success",
        message: "Welcome back to the room",
        roomId,
      }))
    }}