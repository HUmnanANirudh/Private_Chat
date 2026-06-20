import { createWebRTCService } from "../webrtc/index";
import type { ChatManagerCallbacks, ChatManager } from "@repo/types";
import type { ChatManagerContext } from "@repo/types";
import { tryRenegotiate } from "./tryRenegotiate";
import { startConnection } from "./startConnection";
import { joinRoom } from "./joinRoom";
import { leaveRoom } from "./leaveRoom";
import { sendTextMessage } from "./sendTextMessage";
import { sendFile } from "./sendFile";
import { setupSignaling } from "./setupSignaling";
import { setupWebRTC } from "./setupWebRTC";

export function createChatManager(callbacks: ChatManagerCallbacks): ChatManager {
  const context: ChatManagerContext = {
    state: "idle",
    currentRoomId: null,
    currentToken: null,
    isNegotiating: false,
    pendingRenegotiation: false,
    webrtc: createWebRTCService(),
    signaling: null as any, // will be initialized next
    callbacks,
    setState: (newState) => {
      console.log(`[ChatManager] State: ${context.state} -> ${newState}`);
      context.state = newState;
      context.callbacks.onStateChange?.(newState);
    },
    startConnection: async () => {
      await startConnection(context);
    },
    tryRenegotiate: async () => {
      await tryRenegotiate(context);
    },
  };

  context.signaling = setupSignaling(context);
  setupWebRTC(context);

  return {
    get state() {
      return context.state;
    },
    webrtc: context.webrtc,
    signaling: context.signaling,

    joinRoom(roomId, token) {
      return joinRoom(context, roomId, token);
    },
    leaveRoom() {
      leaveRoom(context);
    },
    sendTextMessage(content, sender) {
      return sendTextMessage(context, content, sender);
    },
    sendFile(file, sender) {
      return sendFile(context, file, sender);
    },
  };
}
