import type { ChatManagerContext } from "@repo/types";

export async function startConnection(context: ChatManagerContext) {
  if (context.isNegotiating) return;

  if (context.state !== "connected") {
    context.setState("connecting-to-peer");
  }

  try {
    context.isNegotiating = true;
    const offer = await context.webrtc.createOffer();
    context.signaling.sendOffer(offer, "");
    console.log("[ChatManager] Sent offer");
  } catch (err) {
    console.error("[ChatManager] Error creating offer:", err);
    context.callbacks.onError?.("Failed to create offer");
  } finally {
    context.isNegotiating = false;
    if (context.pendingRenegotiation && context.webrtc.peerConnection?.signalingState === "stable") {
      context.pendingRenegotiation = false;
      context.tryRenegotiate();
    }
  }
}
