import { createSignalingService } from "../signaling/index";
import type { ChatManagerContext, SignalingService } from "@repo/types";

export function setupSignaling(context: ChatManagerContext): SignalingService {
  return createSignalingService({
    onReady: async (isInitiator: boolean) => {
      console.log("[ChatManager] onReady - Both peers joined, starting WebRTC...", isInitiator ? "as initiator" : "as receiver");
      context.webrtc.resetConnection();
      context.setState("waiting");
      await context.webrtc.initialize();
      if (isInitiator) {
        context.startConnection();
      }
    },
    onOffer: async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
      console.log("[ChatManager] onOffer - Received offer, creating answer...");
      try {
        await context.webrtc.createAnswer(data.offer);
        const answer = context.webrtc.peerConnection?.localDescription;
        if (answer) {
          context.signaling.sendAnswer(answer, data.from);
          console.log("[ChatManager] Sent answer");
        }
      } catch (err) {
        console.error("[ChatManager] Error creating answer:", err);
        context.callbacks.onError?.("Failed to create answer");
      }
    },
    onAnswer: async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
      console.log("[ChatManager] onAnswer - Received answer");
      try {
        if (context.webrtc.peerConnection?.signalingState === "have-local-offer") {
          console.log("[ChatManager] We are offer-creator, setting remote description from answer");
          await context.webrtc.peerConnection.setRemoteDescription(data.answer);
          console.log("[ChatManager] Remote description set from answer");
        } else {
          console.log("[ChatManager] Ignoring answer, signalingState is", context.webrtc.peerConnection?.signalingState);
        }
      } catch (err) {
        console.error("[ChatManager] Error setting remote description:", err);
        context.callbacks.onError?.("Failed to set remote description");
      }
    },
    onIceCandidate: async (data: { candidate: RTCIceCandidateInit; from: string }) => {
      console.log("[ChatManager] onIceCandidate - Adding remote ICE candidate...");
      try {
        await context.webrtc.addIceCandidate(data.candidate);
      } catch (err) {
        console.error("[ChatManager] Error adding ICE candidate:", err);
      }
    },
    onPeerDisconnected: async () => {
      console.log("[ChatManager] Peer disconnected, resetting WebRTC...");
      context.webrtc.resetConnection();
      context.setState("waiting");
      await context.webrtc.initialize();
      context.callbacks.onPeerDisconnected?.();
    },
    onError: (error: string) => {
      console.error("[ChatManager] Signaling error:", error);
      context.callbacks.onError?.(error);
    },
  });
}
