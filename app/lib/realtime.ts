import { z } from "zod";
import { redis } from "./redis";
import { InferRealtimeEvents, Realtime } from "@upstash/realtime";
const message = z.object({
  id: z.string(),
  sender: z.string(),
  content: z.string(),
  timestamp: z.number(),
  roomId: z.string(),
  token: z.string().optional(),
});
const schema = {
  chat: {
    message,
    destroy: z.object({
      isDestroyed: z.literal(true),
    }),
  },
};

export const realtime = new Realtime({ schema, redis });

export type RealtimeEvents = InferRealtimeEvents<typeof realtime>;

export type message = z.infer<typeof message>;
