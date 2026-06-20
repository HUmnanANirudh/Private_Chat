import type { WebRTCContext } from "@repo/types";

export function cleanup(context: WebRTCContext) {
  console.log("[WebRTC] Cleaning up...");

  if (context.dataChannel) {
    context.dataChannel.close();
    context.dataChannel = null;
  }

  if (context.peerConnection) {
    context.peerConnection.close();
    context.peerConnection = null;
  }

  context.connectionState = "closed";
  context.dataChannelState = "closed";
  console.log("[WebRTC] Cleanup complete");
}
