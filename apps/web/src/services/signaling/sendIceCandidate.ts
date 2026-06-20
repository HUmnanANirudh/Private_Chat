import type { SignalingMessage } from "@repo/types";

export function sendIceCandidate(
  context: { ws: WebSocket | null; isConnected: boolean },
  candidate: RTCIceCandidateInit,
  _to: string
) {
  if (!context.ws || !context.isConnected) {
    console.error("[Signaling] Cannot send ICE candidate - not connected");
    return;
  }
  const message: SignalingMessage = {
    type: "ice-candidate",
    candidate,
    to: "",
  };
  context.ws.send(JSON.stringify(message));
  console.log("[Signaling] Sent ICE candidate");
}
