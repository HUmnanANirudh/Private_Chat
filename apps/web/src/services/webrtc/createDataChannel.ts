import type { WebRTCContext } from "@repo/types";
import { setupDataChannel } from "./setupDataChannel";

export function createDataChannel(context: WebRTCContext, label: string): RTCDataChannel {
  if (!context.peerConnection) {
    throw new Error("PeerConnection not initialized");
  }

  console.log("[WebRTC] Creating data channel:", label);
  const channel = context.peerConnection.createDataChannel(label);
  context.dataChannel = channel;
  setupDataChannel(context, channel);
  return channel;
}
