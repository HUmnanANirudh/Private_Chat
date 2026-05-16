import { Router } from "express";
import { router as roomsRouter } from "./rooms.routes";

export const router = Router();

router.use("/room", roomsRouter);
