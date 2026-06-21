import { wsSignaling } from "@repo/api-client";

export function sendPeerDisconnect(
  context: { ws: WebSocket | null; isConnected: boolean },
  roomId: string,
  token: string
) {
  if (!context.ws || !context.isConnected) {
    console.error("[Signaling] Cannot send disconnect - not connected");
    return;
  }
  wsSignaling.sendPeerDisconnect(context.ws, roomId, token);
  console.log("[Signaling] Sent peer-disconnect");
}
