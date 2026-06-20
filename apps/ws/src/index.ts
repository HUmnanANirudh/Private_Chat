import type { wsData } from "@repo/types";
import {
  answerHandler,
  offerHandler,
  iceCandidatesHandler,
  joinRoomHandler,
  peerDisconnectHandler,
} from "./handlers";

const server = Bun.serve<wsData>({
  port: 9001,
  fetch(req, server) {
    const cookieHeader = req.headers.get("cookie"); 1
    const token = cookieHeader?.split('=')[1];
    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }
    const upgrade = server.upgrade(req, {
      data: {
        roomId: "",
        token: token,
      },
    });
    if (!upgrade) {
      return new Response("Upgrade failed", { status: 400 });
    }

    return undefined;
  },
  websocket: {
    open(ws) {
      console.log("WebSocket opened", ws.data);
    },
    message(ws, message) {
      try {
        console.log("Received message:", message);
        if (typeof message !== "string") return;

        const data = JSON.parse(message);
        console.log(data);
        switch (data.type) {
          case "join_room":
            joinRoomHandler(ws, data.roomId, data.token);
            break;
          case "offer":
            offerHandler(ws.data.roomId, ws.data.token, data.offer);
            break;
          case "answer":
            answerHandler(ws.data.roomId, ws.data.token, data.answer);
            break;
          case "ice-candidate":
            iceCandidatesHandler(ws.data.roomId, ws.data.token, data.candidate);
            break;
          case "peer-disconnect":
            peerDisconnectHandler(ws.data.roomId, ws.data.token);
            break;
          default:
            console.log("Unknown message type:", data.type);
        }
      } catch (err) {
        console.error(err);
      }
    },
    close(ws) {
      if (!ws.data) return;
      peerDisconnectHandler(ws.data.roomId, ws.data.token);
    },
  },
});

console.log(`WebSocket server running at ws://localhost:${server.port}`);
