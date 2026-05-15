import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { getRoomState } from "../services/rooms.service";

const MAX_PARTICIPANTS = 2;

export const roomAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roomId = req.params.roomId;
        if (!roomId) {
            return res.status(400).json({ message: "Room id is required" });
        }

        const existingToken = req.cookies?.["x-auth-value"];
        const state = await getRoomState(String(roomId));

        if (!state) {
            return res.status(404).json({ message: "Room not found or expired" });
        }

        if (Date.now() > state.expiresAt) {
            return res.status(410).json({ message: "Room has expired" });
        }

        const participantIds = Object.keys(state.participants);
        const isExistingUser = existingToken && participantIds.some(
            id => state.participants[id]?.token === existingToken
        );

        const participantCount = participantIds.length;
        const isRoomFull = !isExistingUser && participantCount >= MAX_PARTICIPANTS;

        if (isRoomFull) {
            return res.status(403).json({ message: "Room is full" });
        }

        let userId: string;
        let isHost = false;

        if (!isExistingUser) {
            userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const token = existingToken || crypto.randomUUID().slice(0, 32);

            res.cookie("x-auth-value", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
                path: "/"
            });

            req.cookies["x-auth-value"] = token;
        } else {
            const participant = participantIds.find(
                id => state.participants[id]?.token === existingToken
            );
            userId = participant!;
            isHost = state.participants[userId]?.isHost || false;
        }

        (req as any).userId = userId;
        (req as any).isHost = isHost;
        next();
    } catch (err) {
        console.error("Error in roomAccess middleware:", err);
        return res.status(500).json({ message: "Internal server error", error: err });
    }
};