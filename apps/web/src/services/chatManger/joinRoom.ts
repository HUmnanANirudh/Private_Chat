import type { ChatManagerContext } from "@repo/types";

export async function joinRoom(context: ChatManagerContext, roomId: string, token: string) {
  console.log(`[ChatManager] Joining room: ${roomId}`);
  context.setState("connecting");
  context.currentRoomId = roomId;
  context.currentToken = token;

  try {
    await context.webrtc.initialize();
    context.signaling.connect(roomId, token);
    context.setState("waiting");
  } catch (err) {
    console.error("[ChatManager] Error joining room:", err);
    context.setState("idle");
    context.callbacks.onError?.("Failed to join room");
    throw err;
  }
}
