import { wsSignaling } from "@repo/api-client";

export function sendOffer(
  context: { ws: WebSocket | null; isConnected: boolean },
  offer: RTCSessionDescriptionInit,
  to: string
) {
  if (!context.ws || !context.isConnected) {
    console.error("[Signaling] Cannot send offer - not connected");
    return;
  }
  wsSignaling.sendOffer(context.ws, offer, to);
  console.log("[Signaling] Sent offer");
}
