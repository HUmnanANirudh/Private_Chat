import { Elysia } from "elysia";
import { redis } from "@/app/lib/redis";
import { CreateRoomSchema } from "../schemas";

const room = new Elysia({prefix: "/room"}).post("/create",async ({body}) =>{
    const {ROOM_TTL_SECONDS} = body;
    const roomId = crypto.randomUUID().slice(0,8);
    const expireAt = Date.now() + ROOM_TTL_SECONDS * 1000;
    await redis.hset(`meta:${roomId}`,{
        connected:[],
        createdAt:Date.now(),
        expireAt
    });
    await redis.expire(`meta:${roomId}`, ROOM_TTL_SECONDS) 
    return {
        roomId,
        expireAt
      };
    },
    {
      body: CreateRoomSchema
    }
);
export const api = new Elysia({ prefix: "/api" }).use(room);
export const GET = api.fetch;
export const POST = api.fetch;

export type App = typeof api