import type { Request, Response } from "express"
import { getRoomMeta, updatedUsers } from "../repositories/rooms.repository"
export const handleRoomAccess = async (req: Request, res: Response) => {
    try {
        const roomId = req.params.roomId;

        if (!roomId) {
            return res.status(400).json({
                message: "room id is required",
            });
        }

        const roomMeta = await getRoomMeta(String(roomId));

        //if no such room exist then room not found
        if(!roomMeta ||Object.keys(roomMeta).length == 0){
            return res.status(404).json({
                message:"no such room exist"
            })
        }

        const token = req.cookies?.["x-auth-value"]

        let participants: string[] = [];

        try{
            participants = JSON.parse(roomMeta.connected || "[]")
        }
        catch{
            return res.status(500).json({
                message: "invalid room data"
            })
        }
    }
    catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err
        })
    }
 }