import { wsSignaling } from "@repo/api-client";

export function sendIceCandidate(
  context: { ws: WebSocket | null; isConnected: boolean },
  candidate: RTCIceCandidateInit,
  to: string
) {
  if (!context.ws || !context.isConnected) {
    console.error("[Signaling] Cannot send ICE candidate - not connected");
    return;
  }
  wsSignaling.sendIceCandidate(context.ws, candidate, to);
  console.log("[Signaling] Sent ICE candidate");
}
