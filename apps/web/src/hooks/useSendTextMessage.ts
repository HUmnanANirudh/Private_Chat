import { useRef } from "react";
import type { UseSendTextMessageProps } from "@repo/types";

export function useSendTextMessage({
  username,
  input,
  setInput,
  chatManagerRef,
  setMessages,
}: UseSendTextMessageProps) {
  const pendingMessagesRef = useRef<string[]>([]);

  const handleSendMessage = () => {
    if (!input.trim() || !chatManagerRef.current) return;
    const content = input.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        content,
        sender: "You",
        timestamp: Date.now(),
        isOwn: true,
      },
    ]);
    setInput("");
    const sent = chatManagerRef.current.sendTextMessage(content, username);
    if (!sent) {
      console.log("[Chat] Data channel not ready, queueing message");
      pendingMessagesRef.current.push(content);
    }
  };

  return { handleSendMessage, pendingMessagesRef };
}
