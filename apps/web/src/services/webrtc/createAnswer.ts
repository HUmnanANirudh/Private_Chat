import type { WebRTCContext } from "@repo/types";

export async function createAnswer(
  context: WebRTCContext,
  offer: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> {
  if (!context.peerConnection) {
    throw new Error("PeerConnection not initialized");
  }

  console.log("[WebRTC] Creating answer...");
  await context.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await context.peerConnection.createAnswer();
  await context.peerConnection.setLocalDescription(answer);
  console.log("[WebRTC] Answer created and set as local description");

  return answer;
}
