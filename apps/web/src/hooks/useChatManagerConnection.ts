import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ChatManagerState, TextMessage, FileMessage, UseChatManagerConnectionProps } from "@repo/types";
import { createChatManager } from "../services/chatManger";
import { api } from "@repo/api-client";

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
  const tokenRef = useRef<string | null>(null);

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
        tokenRef.current = token;

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
            api.getRoom(roomId)
              .then(() => {
                setChatState("waiting");
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

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        chatManagerRef.current &&
        !chatManagerRef.current.signaling?.isConnected
      ) {
        console.log("[Chat] App became visible, signaling is disconnected. Reconnecting...");
        if (tokenRef.current) {
          chatManagerRef.current.joinRoom(roomId, tokenRef.current).catch(err => {
            console.error("[Chat] Failed to reconnect on visibility change:", err);
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
