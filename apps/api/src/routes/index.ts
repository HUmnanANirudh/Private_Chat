import { Router } from "express";
import roomsRouter from "./rooms.routes";

export const router = Router();

router.use("/rooms", roomsRouter);