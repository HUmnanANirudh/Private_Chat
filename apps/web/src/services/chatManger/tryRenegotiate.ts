import type { ChatManagerContext } from "@repo/types";

export async function tryRenegotiate(context: ChatManagerContext) {
  if (context.state === "idle" || context.state === "waiting" || context.state === "connecting") return;
  if (context.isNegotiating || context.webrtc.peerConnection?.signalingState !== "stable") {
    context.pendingRenegotiation = true;
    return;
  }
  console.log("[ChatManager] Executing renegotiation...");
  await context.startConnection();
}
