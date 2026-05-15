import { client } from "../lib/redis";
import crypto from "crypto";

export const getRoomMeta = (roomId: string) => {
    const roomMetaKey = `room:meta:${roomId}`
    return client.hgetall(roomMetaKey);
};

export const createRoom = async (ttlminutes:number,createdToken:string)=>{
    const roomId = crypto.randomUUID().slice(0,12);
    const ttlseconds = ttlminutes*60;

    await client.hset(
        `room:meta:${roomId}`,
        "expiresAt",
        String(Date.now() + ttlseconds * 1000),
        "connected",
        JSON.stringify([createdToken])
    );
    client.expire(`room:meta:${roomId}`, ttlseconds);
    return roomId;
}

export const updatedUsers = (roomId: string, connected: string[]) => {
    const roomMetaKey = `room:meta:${roomId}`
    return client.hset(
        roomMetaKey,
        "connected",
        JSON.stringify(connected)
    );
};

export const destroyRoom = async (roomId: string) => {
    const roomMetaKey = `room:meta:${roomId}`;
    const deleted = await client.del(roomMetaKey);
    return deleted > 0;
}