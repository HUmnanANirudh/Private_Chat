import { Paperclip, Video, Share2, Trash2, MessageSquare } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ChatRoomProps } from "@repo/types";
import { createChatManager } from "../services";
import type { ChatManagerState } from "../services";

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  isOwn: boolean;
}

export default function Chat({ roomId }: ChatRoomProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [chatState, setChatState] = useState<ChatManagerState>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [dataChannelReady, setDataChannelReady] = useState(false);
  const pendingMessagesRef = useRef<string[]>([]);
  const chatManagerRef = useRef<ReturnType<typeof createChatManager> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Flush pending messages when data channel becomes ready
  useEffect(() => {
    if (dataChannelReady && pendingMessagesRef.current.length > 0) {
      console.log("[Chat] Flushing", pendingMessagesRef.current.length, "pending messages");
      pendingMessagesRef.current.forEach((content) => {
        chatManagerRef.current?.sendTextMessage(content, "You");
      });
      pendingMessagesRef.current = [];
    }
  }, [dataChannelReady]);

  const ensureToken = async (): Promise<string> => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    if (urlToken) {
      sessionStorage.setItem("token", urlToken);
      return urlToken;
    }

    const res = await fetch(`/api/v1/room/join?roomId=${roomId}`, { credentials: "include" });
    const data = await res.json();
    if (data.token) {
      sessionStorage.setItem("token", data.token);
      return data.token;
    }

    return crypto.randomUUID().slice(0, 16);
  };

  const callDestroyRoom = async () => {
    try {
      await fetch(`/api/v1/room`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
        credentials: "include",
      });
    } catch (err) {
      console.error("[Chat] Failed to destroy room via API:", err);
    }
  };

  const destroyRoom = () => {
    chatManagerRef.current?.leaveRoom();
    callDestroyRoom();
    navigate({ to: "/" });
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const token = await ensureToken();
        if (!isMounted) return;

        const chatManager = createChatManager({
          onStateChange: (state) => {
            setChatState(state);
            if (state === "connected") {
              setDataChannelReady(true);
            }
            if (state === "disconnected" || state === "idle") {
              navigate({ to: "/" });
            }
          },
          onLocalStream: (stream) => setLocalStream(stream),
          onRemoteStream: (stream) => setRemoteStream(stream),
          onError: (err) => setError(err),
          onPeerDisconnected: () => {
            setRemoteStream(null);
            setChatState("disconnected");
            setDataChannelReady(false);
          },
          onDataChannelOpen: () => {
            console.log("[Chat] Data channel open!");
            setDataChannelReady(true);
          },
          onTextMessage: (message) => {
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
        });

        chatManagerRef.current = chatManager;
        chatManager.joinRoom(roomId, token).catch((err) => {
          console.error("[Chat] Failed to join room:", err);
          setError("Failed to join room");
        });

        return () => {
          chatManager.leaveRoom();
        };
      } catch (err) {
        console.error("[Chat] Init error:", err);
        setError("Failed to initialize");
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [roomId, navigate]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
  };

  const handleSendMessage = () => {
    if (!input.trim() || !chatManagerRef.current) return;
    const content = input.trim();

    // Add to UI immediately
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

    // Try to send via WebRTC if ready, otherwise queue
    const sent = chatManagerRef.current.sendTextMessage(content, "You");
    if (!sent) {
      console.log("[Chat] Data channel not ready, queueing message");
      pendingMessagesRef.current.push(content);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 shrink-0 px-6 py-4 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-white text-sm">
              {roomId.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-100">Secure Room</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-mono">{roomId}</span>
                <span className="text-xs text-zinc-600">•</span>
                <span className={`text-xs ${dataChannelReady ? "text-green-500" : "text-zinc-500"}`}>
                  {dataChannelReady ? "Connected" : "Connecting..."}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-2.5 rounded-lg transition-colors ${isChatOpen ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
              title="Toggle chat"
            >
              <MessageSquare size={18} />
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={destroyRoom}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Destroy Room</span>
            </button>
          </div>
        </header>

        {/* Video / Content Area */}
        <main className="flex-1 relative">
          {chatState === "connecting" || chatState === "idle" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-14 h-14 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              <p className="mt-4 text-zinc-400">Connecting to room...</p>
            </div>
          ) : chatState === "waiting" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-14 h-14 border-4 border-zinc-600 border-t-transparent rounded-full animate-spin" />
              <h2 className="text-xl font-bold mt-4 text-zinc-300">Waiting for peer...</h2>
              <p className="text-sm text-zinc-500 mt-1">Share the room link to invite someone</p>
              <button
                onClick={handleCopy}
                className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors text-sm"
              >
                Copy Room Link
              </button>
            </div>
          ) : remoteStream ? (
            <div className="absolute inset-4 rounded-2xl overflow-hidden bg-black">
              <VideoPlayer stream={remoteStream} className="w-full h-full object-cover" />
              {localStream && (
                <div className="absolute bottom-4 right-4 w-32 h-24 border-2 border-zinc-700 rounded-xl overflow-hidden shadow-xl">
                  <VideoPlayer stream={localStream} muted className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
              <Video size={64} className="text-zinc-600" />
              <h2 className="text-xl font-bold mt-4 text-zinc-500">No video</h2>
              <p className="text-sm text-zinc-600 mt-1">Video stream unavailable</p>
            </div>
          )}
        </main>

        {/* Message Input */}
        <div className="shrink-0 px-6 py-4 bg-zinc-900/80 border-t border-zinc-800">
          <div className="flex items-center gap-3">
            <button
              className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
              title="Attach file"
            >
              <Paperclip size={20} />
            </button>

            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />

            <button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="p-3 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl transition-colors"
            >
              <Paperclip size={20} className="rotate-45" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      {isChatOpen && (
        <aside className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-semibold text-sm">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-zinc-500 text-sm py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.isOwn
                          ? "bg-violet-600 text-white rounded-br-md"
                          : "bg-zinc-800 text-zinc-100 rounded-bl-md"
                      }`}
                    >
                      {!msg.isOwn && (
                        <p className="text-xs text-zinc-400 mb-1 font-medium">{msg.sender}</p>
                      )}
                      <p className="break-words">{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-zinc-600 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
