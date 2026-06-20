import type { SignalingMessage } from "@repo/types";

export function sendAnswer(
  context: { ws: WebSocket | null; isConnected: boolean },
  answer: RTCSessionDescriptionInit,
  _to: string
) {
  if (!context.ws || !context.isConnected) {
    console.error("[Signaling] Cannot send answer - not connected");
    return;
  }
  const message: SignalingMessage = {
    type: "answer",
    answer,
    to: "",
  };
  context.ws.send(JSON.stringify(message));
  console.log("[Signaling] Sent answer");
}
