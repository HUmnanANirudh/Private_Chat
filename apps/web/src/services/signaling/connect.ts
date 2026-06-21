import type { IncomingSignalingMessage, SignalingCallbacks } from "@repo/types";
import { api, wsSignaling } from "@repo/api-client";

export function connect(
  context: { ws: WebSocket | null; isConnected: boolean; callbacks: SignalingCallbacks },
  roomId: string,
  token: string
) {
    const wsUrl = api.getWebSocketUrl(roomId, token);
  console.log(`[Signaling] Connecting to ${wsUrl}`);

  const socket = new WebSocket(wsUrl);
  context.ws = socket;

  socket.onopen = () => {
    console.log("[Signaling] WebSocket connected");
    context.isConnected = true;

    wsSignaling.sendJoinRoom(socket, roomId, token);
    console.log("[Signaling] Sent join_room message");
  };

  socket.onmessage = (event) => {
    try {
      const message: IncomingSignalingMessage = JSON.parse(event.data);
      console.log("[Signaling] Received message:", message.type);

      switch (message.type) {
        case "ready":
          console.log("[Signaling] Both peers ready, can start WebRTC", (message as any).initiator);
          context.callbacks.onReady?.((message as any).initiator || false);
          break;

        case "offer":
          console.log("[Signaling] Received offer from:", message.from);
          context.callbacks.onOffer?.({
            offer: message.data,
            from: message.from,
          });
          break;

        case "answer":
          console.log("[Signaling] Received answer from:", message.from);
          context.callbacks.onAnswer?.({
            answer: message.data,
            from: message.from,
          });
          break;

        case "ice-candidate":
          console.log("[Signaling] Received ICE candidate from:", message.from);
          context.callbacks.onIceCandidate?.({
            candidate: message.data,
            from: message.from,
          });
          break;

        case "peer-disconnect":
          console.log("[Signaling] Peer disconnected:", message.from);
          context.callbacks.onPeerDisconnected?.({ token: message.from });
          break;

        case "error":
          console.error("[Signaling] Error from server:", message.message);
          context.callbacks.onError?.(message.message);
          break;

        default:
          console.warn("[Signaling] Unknown message type:", (message as any).type);
      }
    } catch (err) {
      console.error("[Signaling] Failed to parse message:", err);
    }
  };

  socket.onerror = (error) => {
    console.error("[Signaling] WebSocket error:", error);
    context.callbacks.onError?.("WebSocket connection error");
  };

  socket.onclose = (event) => {
    console.log(`[Signaling] WebSocket closed: ${event.code} ${event.reason}`);
    context.isConnected = false;
    context.ws = null;
  };
}
