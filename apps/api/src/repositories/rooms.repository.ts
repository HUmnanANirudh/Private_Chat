import { client } from "../lib/redis";
import type { Participant } from "@repo/types";

export const getRoomMeta = (roomId: string) => {
    const roomMetaKey = `room:meta:${roomId}`
    return client.hgetall(roomMetaKey);
};

export const updatedUsers = (roomId: string, connected: string[]) => {
    const roomMetaKey = `room:meta:${roomId}`
    return client.hset(
        roomMetaKey,
        "connected",
        JSON.stringify(connected)
    );
};

export const getRoomParticipants = (roomId: string): Promise<Record<string, Participant>> => {
    const roomKey = `room:participant:${roomId}`
    return client.hget(roomKey, "participants").then(p => {
        if (!p) return {};
        try {
            return JSON.parse(p);
        } catch {
            return {};
        }
    }) as Promise<Record<string, Participant>>;
};

export const updateParticipants = (roomId: string, participants: Record<string, Participant>) => {
    const roomKey = `room:participant:${roomId}`
    return client.hset(roomKey, "participants", JSON.stringify(participants));
};