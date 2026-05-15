import { Router } from "express";
import roomsRouter from "./rooms.routes";

const router = Router();

router.use("/rooms", roomsRouter);

export default router;