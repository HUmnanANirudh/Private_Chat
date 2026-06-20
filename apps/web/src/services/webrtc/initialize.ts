import type { WebRTCContext } from "@repo/types";
import { ICE_SERVERS } from "./context";
import { setupDataChannel } from "./setupDataChannel";

export async function initialize(context: WebRTCContext) {
  console.log("[WebRTC] Initializing...");

  // 1. Create RTCPeerConnection with STUN servers
  const peerConnection = new RTCPeerConnection({
    iceServers: ICE_SERVERS,
  });
  context.peerConnection = peerConnection;
  console.log("[WebRTC] PeerConnection created");

  peerConnection.onnegotiationneeded = () => {
    console.log("[WebRTC] Negotiation needed");
    context.onNegotiationNeeded?.();
  };

  // 4. Set up ICE candidate handler
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("[WebRTC] ICE candidate generated:", event.candidate);
      context.onIceCandidate?.(event.candidate);
    }
  };

  // 5. Set up connection state handler
  peerConnection.onconnectionstatechange = () => {
    console.log(`[WebRTC] >>> Connection state changed to: ${peerConnection.connectionState}`);
    context.onConnectionStateChange?.(peerConnection.connectionState);
  };

  peerConnection.onsignalingstatechange = () => {
    const sigState = peerConnection.signalingState || "closed";
    console.log("[WebRTC] Signaling state changed:", sigState);
    context.onSignalingStateChange?.(sigState);
  };

  // 6. Set up ICE connection state handler (more reliable for data channel)
  peerConnection.oniceconnectionstatechange = () => {
    console.log("[WebRTC] ICE connection state:", peerConnection.iceConnectionState);
    if (peerConnection.iceConnectionState === "connected" || peerConnection.iceConnectionState === "completed") {
      console.log("[WebRTC] ICE connected! Data channel should open soon...");
    }
  };

  // 7. Set up data channel handler (for receiving)
  peerConnection.ondatachannel = (event) => {
    console.log("[WebRTC] Data channel RECEIVED from peer:", event.channel.label, "state:", event.channel.readyState);
    context.dataChannel = event.channel;
    setupDataChannel(context, context.dataChannel);
    console.log("[WebRTC] After setupDataChannel, dataChannel state:", context.dataChannel.readyState);
  };
}
