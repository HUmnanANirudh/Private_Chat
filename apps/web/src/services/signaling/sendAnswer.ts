import { wsSignaling } from "@repo/api-client";

export function sendAnswer(
  context: { ws: WebSocket | null; isConnected: boolean },
  answer: RTCSessionDescriptionInit,
  to: string
) {
  if (!context.ws || !context.isConnected) {
    console.error("[Signaling] Cannot send answer - not connected");
    return;
  }
  wsSignaling.sendAnswer(context.ws, answer, to);
  console.log("[Signaling] Sent answer");
}
