import type { ChatManagerContext } from "@repo/types";

export function setupWebRTC(context: ChatManagerContext): void {
  context.webrtc.onIceCandidate = (candidate) => {
    console.log("[ChatManager] ICE candidate generated, sending via signaling...");
    context.signaling.sendIceCandidate(candidate.toJSON(), "");
  };

  context.webrtc.onConnectionStateChange = (connectionState) => {
    console.log("[ChatManager] WebRTC connection state:", connectionState);
    if (connectionState === "connected") {
      context.setState("connected");
    } else if (connectionState === "disconnected" || connectionState === "failed" || connectionState === "closed") {
      context.setState("disconnected");
    }
  };

  context.webrtc.onNegotiationNeeded = async () => {
    context.tryRenegotiate();
  };
  context.webrtc.onDataChannelMessage = (message) => {
    if (message.type === "text") {
      console.log("[ChatManager] Forwarding text message to UI:", message.content);
      context.callbacks.onTextMessage?.(message);
    } else if (message.type === "file") {
      context.callbacks.onFileMessage?.(message);
    }
  };

  context.webrtc.onDataChannelStateChange = (dataChannelState) => {
    console.log("[ChatManager] Data channel state changed:", dataChannelState);
    if (dataChannelState === "open") {
      context.callbacks.onDataChannelOpen?.();
    }
  };

  context.webrtc.onSignalingStateChange = (sigState) => {
    if (sigState === "stable" && context.pendingRenegotiation) {
      context.pendingRenegotiation = false;
      context.tryRenegotiate();
    }
  };
}
