import RoomClient from "./RoomClient";
import { redis } from "../../lib/redis";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  const meta = await redis.hgetall<{
    connected: string[];
    createdAt: number;
    expiresAt: number;
  }>(`meta:${roomId}`);

  const initialMode =
    meta && meta.connected?.length === 1 ? "chat" : "lobby";

  return <RoomClient Mode={initialMode} RoomId={roomId} />;
}
