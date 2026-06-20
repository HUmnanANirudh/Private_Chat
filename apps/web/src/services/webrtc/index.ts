import type { WebRTCService, WebRTCContext } from "@repo/types";
import { initialize } from "./initialize";
import { cleanup } from "./cleanup";
import { createOffer } from "./createOffer";
import { createAnswer } from "./createAnswer";
import { addIceCandidate } from "./addIceCandidate";
import { createDataChannel } from "./createDataChannel";
import { sendTextMessage } from "./sendTextMessage";
import { sendFile } from "./sendFile";
import { resetConnection } from "./resetConnection";

export function createWebRTCService(): WebRTCService {
  const context: WebRTCContext = {
    peerConnection: null,
    connectionState: "new",
    dataChannel: null,
    dataChannelState: "new",
    onIceCandidate: null,
    onConnectionStateChange: null,
    onSignalingStateChange: null,
    onDataChannelMessage: null,
    onDataChannelStateChange: null,
    onNegotiationNeeded: null,
    fileBuffers: new Map<string, string[]>(),
  };

  return {
    get peerConnection() { return context.peerConnection; },
    get connectionState() { return context.connectionState; },
    get dataChannel() { return context.dataChannel; },
    get dataChannelState() { return context.dataChannelState; },

    get onIceCandidate() { return context.onIceCandidate; },
    set onIceCandidate(cb) { context.onIceCandidate = cb; },
    get onConnectionStateChange() { return context.onConnectionStateChange; },
    set onConnectionStateChange(cb) { context.onConnectionStateChange = cb; },
    get onSignalingStateChange() { return context.onSignalingStateChange; },
    set onSignalingStateChange(cb) { context.onSignalingStateChange = cb; },
    get onDataChannelMessage() { return context.onDataChannelMessage; },
    set onDataChannelMessage(cb) { context.onDataChannelMessage = cb; },
    get onDataChannelStateChange() { return context.onDataChannelStateChange; },
    set onDataChannelStateChange(cb) { context.onDataChannelStateChange = cb; },
    get onNegotiationNeeded() { return context.onNegotiationNeeded; },
    set onNegotiationNeeded(cb) { context.onNegotiationNeeded = cb; },

    initialize() {
      return initialize(context);
    },
    cleanup() {
      cleanup(context);
    },
    createOffer() {
      return createOffer(context);
    },
    createAnswer(offer) {
      return createAnswer(context, offer);
    },
    addIceCandidate(candidate) {
      return addIceCandidate(context, candidate);
    },
    createDataChannel(label) {
      return createDataChannel(context, label);
    },
    sendTextMessage(content, sender) {
      return sendTextMessage(context, content, sender);
    },
    sendFile(file, sender) {
      return sendFile(context, file, sender);
    },
    resetConnection() {
      resetConnection(context);
    },
  };
}
