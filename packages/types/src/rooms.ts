import z from "zod";

const createRoom = z.object({
  ttlminutes: z
    .number()
    .int()
    .positive("ttlminutes must be a positive integer")
    .min(1, "ttlminutes must be at least 1")
    .max(1440, "ttlminutes cannot exceed 1440 (24 hours)"),
});

const destroyRoom = z.object({
  roomId: z.string("roomId is required").min(1),
});

const getRoomData = z.object({
  roomId: z.string("roomId is required").min(1),
});

export const roomValidation = {
  "/room/create": { POST: createRoom },
  "/room": { GET: getRoomData, DELETE: destroyRoom },
};
