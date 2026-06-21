import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ChatManagerState, TextMessage, FileMessage, UseChatManagerConnectionProps } from "@repo/types";
import { createChatManager } from "../services/chatManger";

export function useChatManagerConnection({
  roomId,
  isVerifying,
  ensureToken,
  handleRoomDestroyed,
  setMessages,
}: UseChatManagerConnectionProps) {
  const navigate = useNavigate();
  const [chatState, setChatState] = useState<ChatManagerState>("idle");
  const [dataChannelReady, setDataChannelReady] = useState(false);
  const chatManagerRef = useRef<ReturnType<typeof createChatManager> | null>(null);

  useEffect(() => {
    if (isVerifying) return;

    let isMounted = true;
    const connect = async () => {
      try {
        let token: string | null = null;
        try {
          token = await ensureToken();
        } catch (e) {
          if (e instanceof Error && e.message === "Room is full") {
            navigate({ to: "/error/room-full" });
            return;
          }
        }
        if (!token) token = crypto.randomUUID().slice(0, 16);

        if (!isMounted) return;

        const chatManager = createChatManager({
          onStateChange: (state: ChatManagerState) => {
            setChatState(state);
            if (state === "connected") {
              setDataChannelReady(true);
            }
          },
          onError: (err: string) => {
            console.error("[Chat] ChatManager error:", err);
          },
          onPeerDisconnected: () => {
            setDataChannelReady(false);
            fetch(`/api/v1/room?roomId=${roomId}`, { credentials: "include" })
              .then((res) => {
                if (!res.ok) handleRoomDestroyed();
                else setChatState("waiting");
              })
              .catch(() => handleRoomDestroyed());
          },
          onDataChannelOpen: () => {
            console.log("[Chat] Data channel open!");
            setDataChannelReady(true);
          },
          onTextMessage: (message: TextMessage) => {
            setMessages((prev) => [
              ...prev,
              {
                id: message.id || crypto.randomUUID(),
                content: message.content,
                sender: message.sender,
                timestamp: message.timestamp || Date.now(),
                isOwn: false,
              },
            ]);
          },
          onFileMessage: (message: FileMessage) => {
            setMessages((prev) => [
              ...prev,
              {
                id: message.id || crypto.randomUUID(),
                content: `Received file: ${message.name}`,
                sender: message.sender,
                timestamp: message.timestamp || Date.now(),
                isOwn: false,
                isFile: true,
                fileData: message.data,
                fileName: message.name,
                mimeType: message.mimeType,
              },
            ]);
          },
        });

        chatManagerRef.current = chatManager;
        chatManager.joinRoom(roomId, token).catch((err: unknown) => {
          console.error("[Chat] Failed to join room:", err);
          navigate({ to: "/error" });
        });

      } catch (err) {
        console.error("[Chat] connection error:", err);
        navigate({ to: "/error" });
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (chatManagerRef.current) {
        chatManagerRef.current.leaveRoom();
      }
    };
  }, [roomId, navigate, isVerifying, ensureToken, handleRoomDestroyed, setMessages]);

  return {
    chatState,
    setChatState,
    dataChannelReady,
    setDataChannelReady,
    chatManagerRef,
  };
}
