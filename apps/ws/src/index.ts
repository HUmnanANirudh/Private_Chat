import type { wsData } from "./types";
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
    const upgrade = server.upgrade(req, {
      data: {
        roomId: "",
        token: ""
      }
    });

    if (!upgrade) {
      return undefined;
    }

    return new Response("WebSocket connection established", { status: 400 });
  },
  websocket: {
    open(ws) {
      console.log("WebSocket opened", ws);
    },
    message(ws, message) {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case "join_room":
            joinRoomHandler(ws, data.roomId, data.token);
            break;
          case "offer":
            offerHandler(data.roomId, data.token, data.sdp);
            break;
          case "answer":
            answerHandler(data.roomId, data.token, data.sdp);
            break;
          case "ice-candidate":
            iceCandidatesHandler(data.roomId, data.token, data.candidate);
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
