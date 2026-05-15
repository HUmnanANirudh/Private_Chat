import type { Request, Response } from "express"
import { getRoomMeta , createRoom,destroyRoom } from "../repositories/rooms.repository"

export const getRoomData = async (req: Request, res: Response) => {
    try {
        const roomId = req.params.roomId
        if(!roomId) {
            return res.status(400).json({
                message: "Room id is required"
            })
        }
        const data = await getRoomMeta(String(roomId));
        if(Object.keys(data).length === 0) {
            return res.status(404).json({
                message: "Room not found"
            })
        }

        return res.status(200).json({
            message: "room data fetched successfully",
            Data: data
        })
    } catch (err) {
        return res.status(500).json({
            message: "failed to fetch room data",
            error: err
        })
    }
}

export const createRoomController = async (req: Request, res: Response) => {
    try {
        const { ttlMinutes } = req.body;

        if (!ttlMinutes || typeof ttlMinutes !== "number" || ttlMinutes < 1 || ttlMinutes > 1440) {
            return res.status(400).json({ message: "ttlMinutes must be a number between 1 and 1440 (24 hours)" });
        }

        const token = req.participantToken;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No participant token" });
        }
        const roomId = await createRoom(ttlMinutes, token);
        return res.status(201).json({
            message: "Room created successfully",
            token,
            roomId
        });
    } catch (err) {
        return res.status(500).json({
            message: "Failed to create room",
            error: err
        });
    }
};

export const destroyRoomController = async (req: Request, res: Response) => {
    try {
        const roomId = req.body.roomId;
        const token = req.participantToken;
        console.log("Destroy room request received for roomId:", roomId, "with token:", token);
        if (!roomId) {
            return res.status(400).json({
                message: "Room id is required"
            });
        }
        const existingRoom = await getRoomMeta(String(roomId));
        if (Object.keys(existingRoom).length === 0) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        const connectedUsers = JSON.parse(existingRoom.connected || "[]");
        if (!connectedUsers.includes(token)) {
            return res.status(403).json({
                message: "Forbidden: You are not a participant of this room"
            });
        }

        const deleted = await destroyRoom(String(roomId));
        if (!deleted) {
            return res.status(404).json({
                message: "Room not deleted, it may have already been destroyed"
            });
        }
        return res.status(200).json({
            message: "Room destroyed successfully"
        });
    } catch (err) {
        return res.status(500).json({
            message: "Failed to destroy room",
            error: err
        });
    }
};