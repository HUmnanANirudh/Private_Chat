import type { Request, Response } from "express";
import {
  getRoomMeta,
  createRoom,
  destroyRoom,
  updatedUsers,
} from "../repositories";

export const getRoomDataController = async (req: Request, res: Response) => {
  try {
    const roomId = req.query.roomId;

    if (!roomId) {
      return res.status(400).json({
        message: "Room id is required",
      });
    }

    const data = await getRoomMeta(String(roomId));

    console.log("Room data fetched for roomId:", roomId, "Data:", data);
    if (Object.keys(data.meta).length === 0) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    return res.status(200).json({
      message: "room data fetched successfully",
      Data: data,
    });
  } catch (err: Error | any) {
    return res.status(500).json({
      message: "failed to fetch room data",
      error: err?.message || err,
    });
  }
};

export const createRoomController = async (req: Request, res: Response) => {
  try {
    const { ttlminutes } = req.body;

    if (
      !ttlminutes ||
      typeof ttlminutes !== "number" ||
      ttlminutes < 1 ||
      ttlminutes > 1440
    ) {
      return res
        .status(400)
        .json({
          message: "ttlminutes must be a number between 1 and 1440 (24 hours)",
        });
    }

    const token = req.participantToken;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No participant token" });
    }
    const roomId = await createRoom(ttlminutes, token);
    return res.status(201).json({
      message: "Room created successfully",
      token,
      roomId,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to create room",
      error: err,
    });
  }
};

export const destroyRoomController = async (req: Request, res: Response) => {
  try {
    const roomId = req.body.roomId;
    const token = req.participantToken;
    console.log(
      "Destroy room request received for roomId:",
      roomId,
      "with token:",
      token,
    );
    if (!roomId) {
      return res.status(400).json({
        message: "Room id is required",
      });
    }
    const existingRoom = await getRoomMeta(String(roomId));
    console.log("Existing room data for destroy request:", existingRoom);
    if (Object.keys(existingRoom.meta || {}).length === 0 ) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    if (!existingRoom.participants.includes(String(token))) {
      return res.status(403).json({
        message: "Forbidden: You are not a participant of this room",
      });
    }

    const deleted = await destroyRoom(String(roomId));
    if (!deleted) {
      return res.status(404).json({
        message: "Room not deleted, it may have already been destroyed",
      });
    }
    return res.status(200).json({
      message: "Room destroyed successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to destroy room",
      error: err,
    });
  }
};

export const joinRoomController = async (req: Request, res: Response) => {
  try {
    const roomId = req.query.roomId;
    const token = req.participantToken;
    console.log({ roomId, token });
    if (!roomId) {
      return res.status(400).json({
        message: "Room id is required",
      });
    }
    const existingRoom = await getRoomMeta(String(roomId));
    if (Object.keys(existingRoom.meta || {}).length === 0 ) {
      return res.status(404).json({
        message: "Room not found",
      });
    }
    if (
      !existingRoom.participants.includes(String(token)) &&
      existingRoom.participants.length < 2
    ) {
      const updated = await updatedUsers(String(roomId), String(token));
      console.log({ updated });
      return res.status(200).json({
        message: "Joined room successfully",
        roomId,
        updated,
      });
    }

    if (
      !existingRoom.participants.includes(String(token)) &&
      existingRoom.participants.length >= 2
    ) {
      return res.status(403).json({
        message: "Room already has maximum participants",
      });
    }

    if (existingRoom.participants.includes(String(token))) {
      return res.status(200).json({
        message: "Welcome back to the room",
        roomId,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Failed to join room",
      error: err,
    });
  }
};
