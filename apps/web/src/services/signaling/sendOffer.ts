import type { SignalingMessage } from "@repo/types";

export function sendOffer(
  context: { ws: WebSocket | null; isConnected: boolean },
  offer: RTCSessionDescriptionInit,
  _to: string
) {
  if (!context.ws || !context.isConnected) {
    console.error("[Signaling] Cannot send offer - not connected");
    return;
  }
  const message: SignalingMessage = {
    type: "offer",
    offer,
    to: "",
  };
  context.ws.send(JSON.stringify(message));
  console.log("[Signaling] Sent offer");
}
