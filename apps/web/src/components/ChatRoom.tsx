import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ChatRoomProps } from "@repo/types";
import { useUsername } from "../hooks/useUsername";
import { useRoomTimer } from "../hooks/useRoomTimer";
import { useRoomToken } from "../hooks/useRoomToken";
import { useChatMessages } from "../hooks/useChatMessages";
import { useVerifyRoom } from "../hooks/useVerifyRoom";
import { useChatManagerConnection } from "../hooks/useChatManagerConnection";
import { useClipboardCopy } from "../hooks/useClipboardCopy";
import { useSendFile } from "../hooks/useSendFile";
import { useSendTextMessage } from "../hooks/useSendTextMessage";
import { useDestroyRoom } from "../hooks/useDestroyRoom";
import ChatHeader from "./chat/ChatHeader";
import MessageList from "./chat/MessageList";
import ChatInput from "./chat/ChatInput";

export default function Chat({ roomId }: ChatRoomProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");

  const { username } = useUsername();
  const { ensureToken } = useRoomToken(roomId);
  const { messages, setMessages, messagesEndRef } = useChatMessages();

  const handleRoomDestroyed = () => {
    navigate({ to: "/error/room-not-found" });
  };

  const { expiresAt, isVerifying } = useVerifyRoom(roomId);

  const {
    chatState,
    dataChannelReady,
    chatManagerRef,
  } = useChatManagerConnection({
    roomId,
    username,
    isVerifying,
    ensureToken,
    handleRoomDestroyed,
    setMessages,
  });

  const { timeRemaining, formatTime } = useRoomTimer(expiresAt, handleRoomDestroyed);

  const { handleCopy } = useClipboardCopy();

  const { handleFileChange } = useSendFile({
    username,
    chatManagerRef,
    setMessages,
  });

  const { handleSendMessage, pendingMessagesRef } = useSendTextMessage({
    username,
    input,
    setInput,
    chatManagerRef,
    setMessages,
  });

  const { destroyRoom } = useDestroyRoom({
    roomId,
    chatManagerRef,
    handleRoomDestroyed,
  });

  useEffect(() => {
    if (dataChannelReady && pendingMessagesRef.current.length > 0) {
      console.log("[Chat] All Messages sent", pendingMessagesRef.current.length, "pending messages");
      pendingMessagesRef.current.forEach((content) => {
        chatManagerRef.current?.sendTextMessage(content, username);
      });
      pendingMessagesRef.current = [];
    }
  }, [dataChannelReady, username, chatManagerRef, pendingMessagesRef]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden relative max-w-4xl mx-auto border-x border-zinc-800/50 shadow-2xl">
      <ChatHeader
        dataChannelReady={dataChannelReady}
        expiresAt={expiresAt}
        timeRemaining={timeRemaining}
        formatTime={formatTime}
        handleCopy={handleCopy}
        destroyRoom={destroyRoom}
      />

      <MessageList
        messages={messages}
        dataChannelReady={dataChannelReady}
        chatState={chatState}
        messagesEndRef={messagesEndRef}
      />

      <ChatInput
        input={input}
        setInput={setInput}
        dataChannelReady={dataChannelReady}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
        handleSendMessage={handleSendMessage}
      />
    </div>
  );
}
