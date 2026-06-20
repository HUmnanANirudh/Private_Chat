import type { ChatManagerContext } from "@repo/types";

export function sendTextMessage(context: ChatManagerContext, content: string, sender: string): boolean {
  return context.webrtc.sendTextMessage(content, sender);
}
