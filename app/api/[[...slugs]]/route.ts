import { realtime } from "@/app/lib/realtime";
import { redis } from "@/app/lib/redis";
import { Elysia, t } from "elysia";
import { CreateRoomSchema } from "../schemas";
import { authMiddleware } from "./auth";

const room = new Elysia({ prefix: "/room" })
  .post(
    "/create",
    async ({ body }) => {
      const { ROOM_TTL_SECONDS } = body;
      const roomId = crypto.randomUUID().slice(0, 8);
      const expireAt = Date.now() + ROOM_TTL_SECONDS * 1000;
      await redis.hset(`meta:${roomId}`, {
        connected: [],
        createdAt: Date.now(),
        expireAt,
      });
      await redis.expire(`meta:${roomId}`, ROOM_TTL_SECONDS);
      return {
        roomId,
        expireAt,
      };
    },
    {
      body: CreateRoomSchema,
    }
  )
  .use(authMiddleware)
  .get(
    "ttl",
    async ({ auth }) => {
      const ttl = await redis.ttl(`meta:${auth.roomId}`);
      return { ttl: ttl > 0 ? ttl : 0 };
    },
    { query: t.Object({ roomId: t.String() }) }
  )
  .delete(
    "/",
    async ({ auth }) => {
      await realtime
        .channel(auth.roomId)
        .emit("chat.destroy", { isDestroyed: true });
      Promise.all([
        await redis.del(`meta:${auth.roomId}`),
        await redis.del(`messages:${auth.roomId}`),
      ]);
    },
    { query: t.Object({ roomId: t.String() }) }
  );

const messages = new Elysia({ prefix: "/messages" })
  .use(authMiddleware)
  .post(
    "/messages",
    async ({ body, auth }) => {
      const { sender, content } = body;
      const roomExist = await redis.exists(`meta:${auth.roomId}`);
      if (!roomExist) {
        throw new Error("Room does not exist");
      }
      const message = {
        id: crypto.randomUUID().slice(0, 6),
        sender,
        content,
        timestamp: Date.now(),
        roomId: auth.roomId,
      };

      await redis.rpush(`messages:${auth.roomId}`, {
        ...message,
        token: auth.token,
      });

      await realtime.channel(auth.roomId).emit("chat.message", message);

      const ttl = await redis.ttl(`meta:${auth.roomId}`);
      await redis.expire(`messages:${auth.roomId}`, ttl);
      await redis.expire(`history:${auth.roomId}`, ttl);
      await redis.expire(`${auth.roomId}`, ttl);

      return { success: true };
    },
    {
      query: t.Object({ roomId: t.String() }),
      body: t.Object({
        sender: t.String({ maxLength: 30 }),
        content: t.String({ maxLength: 1000 }),
      }),
      response: t.Object({
        success: t.Boolean(),
      }),
    }
  )
  .get("/messages", async ({ auth }) => {
    const messages = await redis.lrange(`messages:${auth.roomId}`, 0, -1);

    return {
      messages: messages.map((m: any) => ({
        ...m,
        token: m.token === auth.token ? auth.token : undefined,
      })),
    };
  });
export const api = new Elysia({ prefix: "/api" }).use(room).use(messages);
export const GET = api.fetch;
export const POST = api.fetch;

export type App = typeof api;
