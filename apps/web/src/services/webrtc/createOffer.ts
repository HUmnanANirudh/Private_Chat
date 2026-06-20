import type { WebRTCContext } from "@repo/types";
import { setupDataChannel } from "./setupDataChannel";

export async function createOffer(context: WebRTCContext): Promise<RTCSessionDescriptionInit> {
  if (!context.peerConnection) {
    throw new Error("PeerConnection not initialized");
  }

  console.log("[WebRTC] Creating offer...");

  // Create data channel first (will be negotiated with offer)
  if (!context.dataChannel) {
    context.dataChannel = context.peerConnection.createDataChannel("chat");
    setupDataChannel(context, context.dataChannel);
  }

  const offer = await context.peerConnection.createOffer();
  await context.peerConnection.setLocalDescription(offer);
  console.log("[WebRTC] Offer created and set as local description");

  return offer;
}
