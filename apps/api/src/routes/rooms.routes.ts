import { Router } from "express";
import { createRoomController, destroyRoomController, getRoomDataController,joinRoomController } from "../controllers";
import { assign, extract } from "../middleware";

export const router = Router();

router.get("/", getRoomDataController);
router.post("/join", assign, joinRoomController);
router.post("/create",assign,createRoomController); 
router.delete("/", extract, destroyRoomController);