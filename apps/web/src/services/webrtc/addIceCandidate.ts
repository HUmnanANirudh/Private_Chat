import type { WebRTCContext } from "@repo/types";

export async function addIceCandidate(
  context: WebRTCContext,
  candidate: RTCIceCandidateInit
): Promise<void> {
  if (!context.peerConnection) {
    throw new Error("PeerConnection not initialized");
  }

  console.log("[WebRTC] Adding ICE candidate...");
  await context.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  console.log("[WebRTC] ICE candidate added");
}
