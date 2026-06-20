import type { ChatManagerContext } from "@repo/types";

export async function sendFile(context: ChatManagerContext, file: File, sender: string): Promise<boolean> {
  return await context.webrtc.sendFile(file, sender);
}
