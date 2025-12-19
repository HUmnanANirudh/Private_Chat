import { Elysia, t } from "elysia";
import { redis } from "@/app/lib/redis";
const ROOM_TTL_SECONDS = 60*10
const room = new Elysia({prefix: "/room"}).post("/create",async () =>{
    // const {ROOM_TTL_SECONDS} = body;
    const roomId = crypto.randomUUID().slice(0,8);
    await redis.hset(`meta:${roomId}`,{
        connected:[],
        createdAt:Date.now()
    });
    await redis.expire(`meta:${roomId}`, ROOM_TTL_SECONDS) 
    return {
        roomId,
        expiresIn: ROOM_TTL_SECONDS
      };
    // },
    // {
    //   body: t.Object({
    //     ROOM_TTL_SECONDS: t.Number()
    //   })
    // }
});
export const api = new Elysia({ prefix: "/api" }).use(room);
export const GET = api.fetch;
export const POST = api.fetch;

export type App = typeof api