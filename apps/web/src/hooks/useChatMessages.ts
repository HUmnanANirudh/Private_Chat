import { useState, useRef, useEffect } from "react";
import type { Message } from "@repo/types";

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return {
    messages,
    setMessages,
    messagesEndRef,
    scrollToBottom,
  };
}
