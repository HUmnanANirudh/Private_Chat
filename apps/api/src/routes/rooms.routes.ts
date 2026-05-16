import { Router } from "express";
import { createRoomController, destroyRoomController, getRoomDataController,joinRoomController } from "../controllers";
import { assign } from "../middleware/assign.middleware";
import { extract } from "../middleware/extract.middleware";

export const router = Router();

router.get("/", getRoomDataController);
router.get("/join", assign, joinRoomController);
router.post("/create",assign,createRoomController); 
router.delete("/", extract, destroyRoomController);