import type { TextMessage } from "@repo/types";
import type { WebRTCContext } from "@repo/types";

export function sendTextMessage(context: WebRTCContext, content: string, sender: string): boolean {
  if (!context.dataChannel) {
    console.error("[WebRTC] Data channel not initialized");
    return false;
  }
  if (context.dataChannel.readyState !== "open") {
    console.warn("[WebRTC] Data channel not open yet, state:", context.dataChannel.readyState);
    return false;
  }

  const message: TextMessage = {
    type: "text",
    id: crypto.randomUUID(),
    content,
    sender,
    timestamp: Date.now(),
  };

  context.dataChannel.send(JSON.stringify(message));
  console.log("[WebRTC] Sent text message:", content);
  return true;
}
