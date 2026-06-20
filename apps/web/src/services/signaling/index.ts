import type { SignalingCallbacks, SignalingService } from "@repo/types";
import { connect } from "./connect";
import { disconnect } from "./disconnect";
import { sendOffer } from "./sendOffer";
import { sendAnswer } from "./sendAnswer";
import { sendIceCandidate } from "./sendIceCandidate";
import { sendPeerDisconnect } from "./sendPeerDisconnect";

export function createSignalingService(callbacks: SignalingCallbacks): SignalingService {
  const context = {
    ws: null as WebSocket | null,
    isConnected: false,
    callbacks,
  };

  return {
    get isConnected() {
      return context.isConnected;
    },
    connect(roomId: string, token: string) {
      connect(context, roomId, token);
    },
    disconnect() {
      disconnect(context);
    },
    sendOffer(offer: RTCSessionDescriptionInit, to: string) {
      sendOffer(context, offer, to);
    },
    sendAnswer(answer: RTCSessionDescriptionInit, to: string) {
      sendAnswer(context, answer, to);
    },
    sendIceCandidate(candidate: RTCIceCandidateInit, to: string) {
      sendIceCandidate(context, candidate, to);
    },
    sendPeerDisconnect(roomId: string, token: string) {
      sendPeerDisconnect(context, roomId, token);
    },
  };
}
