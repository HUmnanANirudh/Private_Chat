import { RedisClient } from "bun";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
console.log("Connecting to Redis at:", redisUrl);

export const client = new RedisClient(redisUrl);

export const roomKey = (roomId: string) => `room:${roomId}`;
export const roomMetaKey = (roomId: string) => `room:meta:${roomId}`;

client.onconnect = () => {
    console.log("Redis connected");
};

client.onclose = () => {
    console.log("Redis disconnected");
};