import type { ChatManagerContext } from "@repo/types";

export function leaveRoom(context: ChatManagerContext) {
  console.log("[ChatManager] Leaving room");
  context.signaling.sendPeerDisconnect(context.currentRoomId ?? "", context.currentToken ?? "");
  context.signaling.disconnect();
  context.webrtc.cleanup();
  context.setState("idle");
  context.currentRoomId = null;
  context.currentToken = null;
}
