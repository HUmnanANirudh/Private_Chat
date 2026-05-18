import { RedisClient } from "bun";

const redisUrl = process.env.REDIS_URL;
if(!redisUrl) {
    throw new Error("REDIS_URL is not defined in environment variables");
}
export const client = new RedisClient(redisUrl);

export const initRedis = async () => {
    try {
        await client.connect();
        console.log("Connected to Redis successfully");
    } catch (err) {
        console.error("Failed to connect to Redis:", err);
        throw err;
    }
}