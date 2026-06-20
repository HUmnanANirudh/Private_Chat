import type { SignalingMessage } from "@repo/types";

export function sendPeerDisconnect(
  context: { ws: WebSocket | null; isConnected: boolean },
  roomId: string,
  token: string
) {
  if (!context.ws || !context.isConnected) {
    console.error("[Signaling] Cannot send disconnect - not connected");
    return;
  }
  const message: SignalingMessage = {
    type: "peer-disconnect",
    roomId,
    token,
  };
  context.ws.send(JSON.stringify(message));
  console.log("[Signaling] Sent peer-disconnect");
}
