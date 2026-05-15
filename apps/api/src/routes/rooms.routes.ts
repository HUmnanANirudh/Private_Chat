import { Router } from "express";
import { createRoomController, destroyRoomController, getRoomData } from "../controllers";
import { assign } from "../middleware/assign";
import { extract } from "../middleware/extract";

export const router = Router();

router.get("/:roomId", getRoomData);
router.post("/create",assign,createRoomController); 
router.delete("/", extract, destroyRoomController);

// router.post("/", async (req: Request, res: Response) => {
//     try {
//         const { ttlMinutes } = req.body;

//         if (!ttlMinutes || typeof ttlMinutes !== "number" || ttlMinutes < 1 || ttlMinutes > 1440) {
//             return res.status(400).json({ message: "ttlMinutes must be a number between 1 and 1440 (24 hours)" });
//         }

//         const room = await createRoom(ttlMinutes);

//         return res.status(201).json({
//             roomId: room.id,
//             expiresAt: room.expiresAt,
//             maxParticipants: room.maxParticipants
//         });
//     } catch (err) {
//         console.error("Error creating room:", err);
//         return res.status(500).json({ message: "Failed to create room", error: err });
//     }
// });

// router.get("/:roomId", roomAccess, async (req: Request, res: Response) => {
//     try {
//         const { roomId } = req.params;
//         const state = await getRoomState(String(roomId));

//         if (!state) {
//             return res.status(404).json({ message: "Room not found" });
//         }

//         return res.status(200).json({
//             id: state.id,
//             hostId: state.hostId,
//             maxParticipants: state.maxParticipants,
//             participantCount: Object.keys(state.participants).length,
//             createdAt: state.createdAt,
//             expiresAt: state.expiresAt,
//             hasActivePoll: !!state.activePoll
//         });
//     } catch (err) {
//         console.error("Error getting room:", err);
//         return res.status(500).json({ message: "Failed to get room", error: err });
//     }
// });

// router.delete("/:roomId", roomAccess, async (req: Request, res: Response) => {
//     try {
//         const { roomId } = req.params;
//         const destroyed = await destroyRoom(String(roomId));

//         if (!destroyed) {
//             return res.status(404).json({ message: "Room not found or already destroyed" });
//         }

//         return res.status(200).json({ message: "Room destroyed successfully" });
//     } catch (err) {
//         console.error("Error destroying room:", err);
//         return res.status(500).json({ message: "Failed to destroy room", error: err });
//     }
// });

export default router;