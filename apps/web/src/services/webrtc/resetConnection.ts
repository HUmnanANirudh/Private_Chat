import type { WebRTCContext } from "@repo/types";

export function resetConnection(context: WebRTCContext) {
  console.log("[WebRTC] Resetting connection...");
  if (context.dataChannel) {
    context.dataChannel.close();
    context.dataChannel = null;
  }
  if (context.peerConnection) {
    context.peerConnection.close();
    context.peerConnection = null;
  }
}
