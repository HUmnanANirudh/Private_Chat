import { client } from "./index";
import crypto from "crypto";

export const getRoomMeta = async (roomId: string) => {
  const [meta, participants] = await Promise.all([
    client.hgetall(`room:${roomId}:meta`),
    client.smembers(`room:${roomId}:participants`),
  ]);
  return {
    meta,
    participants,
    roomId,
  };
};

export const createRoom = async (ttlminutes: number, createdToken: string) => {
  const roomId = crypto.randomBytes(8).toString('base64');
  const ttlseconds = ttlminutes * 60;
  const now = Date.now();
  await Promise.all([
    client.hset(
      `room:${roomId}:meta`,
      "createdAt",
      String(now),
      "expiresAt",
      String(now + ttlseconds * 1000),
      "createBy",
      createdToken,
    ),
    client.sadd(`room:${roomId}:participants`, createdToken),
    client.expire(`room:${roomId}:meta`, ttlseconds),
    client.expire(`room:${roomId}:participants`, ttlseconds),
  ]);

  return roomId;
};

export const addParticipant = (roomId: string, token: string) => {
  return client.sadd(`room:${roomId}:participants`, token);
};

export const destroyRoom = async (roomId: string) => {
  const roomMetaKey = `room:${roomId}:meta`;
  const participantsKey = `room:${roomId}:participants`;

  return await Promise.all([
    client.del(roomMetaKey),
    client.del(participantsKey),
  ]);
};
