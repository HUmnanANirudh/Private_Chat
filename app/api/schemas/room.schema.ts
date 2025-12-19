import { t } from "elysia";

export const CreateRoomSchema = t.Object({
  ROOM_TTL_SECONDS: t.Number()
});

export const RoomResponseSchema = t.Object({
  roomId: t.String(),
  expireAt: t.Number()
});
