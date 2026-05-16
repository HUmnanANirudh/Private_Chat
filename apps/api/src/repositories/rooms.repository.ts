import { client } from "../lib/redis";
import crypto from "crypto";

export const getRoomMeta = async (roomId: string) => {
    const [meta, participants] = await Promise.all([
        client.hgetall(`room:meta:${roomId}`),
        client.smembers(`room:participants:${roomId}`)
    ]);
    return {
        meta ,
        participants,
        roomId
    };
};

export const createRoom = async (ttlminutes:number,createdToken:string)=>{
    const roomId = crypto.randomUUID().slice(0,12);
    const ttlseconds = ttlminutes*60;

    await client.hset(
        `room:meta:${roomId}`,
        "createdAt",
        String(Date.now()),
        "expiresAt",
        String(Date.now() + ttlseconds * 1000),
        "createBy",
        createdToken
    );
    await client.sadd(`room:participants:${roomId}`,createdToken);

    await Promise.all([
        client.expire(`room:meta:${roomId}`, ttlseconds),
        client.expire(`room:participants:${roomId}`, ttlseconds)
    ]);
    return roomId;
}

export const updatedUsers = (roomId: string,token: string) => {
    return client.sadd(
        `room:participants:${roomId}`,token
    );
};

export const destroyRoom = async (roomId: string) => {
    const roomMetaKey = `room:meta:${roomId}`;
    const participantsKey = `room:participants:${roomId}`;

    const deleted = Promise.all([
        client.del(roomMetaKey),
        client.del(participantsKey)
    ])
    
    return deleted;
}