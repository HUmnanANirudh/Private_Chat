import { Paperclip, Share2, Trash2, Download, Clock } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ChatRoomProps } from "@repo/types";
import { createChatManager } from "../services/index";
import type { ChatManagerState, TextMessage, FileMessage } from "../services/index";

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  isOwn: boolean;
  isFile?: boolean;
  isSending?: boolean;
  fileData?: string;
  fileName?: string;
  mimeType?: string;
}

export default function Chat({ roomId }: ChatRoomProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [chatState, setChatState] = useState<ChatManagerState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [dataChannelReady, setDataChannelReady] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showDestroyModal, setShowDestroyModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingMessagesRef = useRef<string[]>([]);
  const chatManagerRef = useRef<ReturnType<typeof createChatManager> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const showModalRef = useRef(false);
  const destroyIntervalRef = useRef<NodeJS.Timeout | number | null>(null);

  const [username, setUsername] = useState("Peer");

  // Load username
  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored) {
      setUsername(stored);
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);
      setTimeRemaining(remaining);
      if (remaining === 0) {
        handleRoomDestroyed();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  // Redirect Countdown effect
  useEffect(() => {
    if (error === "Room is full") {
      setRedirectCountdown(10);
    }
  }, [error]);

  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      navigate({ to: "/" });
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, navigate]);

  const handleRoomDestroyed = () => {
    if (showModalRef.current) return;
    showModalRef.current = true;
    setShowDestroyModal(true);
    let count = 5;
    setCountdown(count);
    
    if (destroyIntervalRef.current) {
      clearInterval(destroyIntervalRef.current);
    }
    
    destroyIntervalRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        if (destroyIntervalRef.current) {
          clearInterval(destroyIntervalRef.current);
        }
        navigate({ to: "/" });
      }
    }, 1000);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

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
        chatManagerRef.current?.sendTextMessage(content, username);
      });
      pendingMessagesRef.current = [];
    }
  }, [dataChannelReady, username]);

  const ensureToken = async (): Promise<string | null> => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    if (urlToken) {
      sessionStorage.setItem("token", urlToken);
      return urlToken;
    }

    try {
      const res = await fetch(`/api/v1/room/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          sessionStorage.setItem("token", data.token);
          return data.token;
        }
      } else if (res.status === 403) {
        throw new Error("Room is full");
      }
    } catch (e) {
      console.error("[Chat] Failed to join via API", e);
      throw e;
    }
    return null;
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

  const destroyRoom = async () => {
    chatManagerRef.current?.leaveRoom();
    await callDestroyRoom();
    handleRoomDestroyed();
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // First verify room exists
        const roomRes = await fetch(`/api/v1/room?roomId=${roomId}`, { credentials: "include" });
        if (!roomRes.ok) {
          console.error("[Chat] Room fetch failed", roomRes.status);
          if (roomRes.status === 404) {
            setError("No such room exists");
          } else {
            setError("Failed to fetch room details");
          }
          return;
        }

        const data = await roomRes.json();
        if (data?.Data?.meta?.expiresAt) {
          setExpiresAt(parseInt(data.Data.meta.expiresAt));
        }

        let token: string | null = null;
        try {
          token = await ensureToken();
        } catch (e) {
          if (e instanceof Error && e.message === "Room is full") {
            setError("Room is full");
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
          onError: (err: string) => setError(err),
          onPeerDisconnected: () => {
            setDataChannelReady(false);
            // Verify if room was actually destroyed
            fetch(`/api/v1/room?roomId=${roomId}`, { credentials: "include" })
              .then(res => {
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
                mimeType: message.mimeType
              },
            ]);
          },
        });

        chatManagerRef.current = chatManager;
        chatManager.joinRoom(roomId, token).catch((err: unknown) => {
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
      if (destroyIntervalRef.current) {
        clearInterval(destroyIntervalRef.current);
      }
    };
  }, [roomId, navigate]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      alert("Link copied to clipboard!");
    } catch (e) {
      console.error("Copy failed", e);
      alert("Could not copy link. Your browser may require HTTPS for this feature.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && chatManagerRef.current) {
      const messageId = crypto.randomUUID();
      
      // Temporary sending message
      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          content: `Sending file: ${file.name}... (Please wait)`,
          sender: "You",
          timestamp: Date.now(),
          isOwn: true,
          isFile: false,
          isSending: true,
          fileName: file.name,
        },
      ]);

      const success = await chatManagerRef.current.sendFile(file, username);
      
      if (success) {
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId ? {
            ...msg,
            content: `Sent file: ${file.name}`,
            isFile: true,
            isSending: false,
            fileName: file.name,
          } : msg
        ));
      } else {
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId ? {
            ...msg,
            content: `Failed to send file: ${file.name}`,
            isSending: false,
          } : msg
        ));
      }
    }
    if (e.target) e.target.value = "";
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
    const sent = chatManagerRef.current.sendTextMessage(content, username);
    if (!sent) {
      console.log("[Chat] Data channel not ready, queueing message");
      pendingMessagesRef.current.push(content);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden relative max-w-4xl mx-auto border-x border-zinc-800/50 shadow-2xl">
      {error === "Room is full" && (
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden flex flex-col items-center">
            {/* Ambient background glow */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Warning icon */}
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-5 animate-pulse">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight mb-3">Room is Full</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">
              This private chat room has reached its maximum capacity of 2 participants. You cannot join this room at the moment.
            </p>
            
            {/* Progress/Timer indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold mb-6 border border-zinc-700/50">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Redirecting to Lobby in {redirectCountdown}s
            </div>
            
            <button
              onClick={() => navigate({ to: "/" })}
              className="w-full py-3 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold transition-all shadow-lg hover:shadow-white/5 active:scale-[0.98]"
            >
              Go to Home
            </button>
          </div>
        </div>
      )}

      {(error === "No such room exists" || error === "Room not found") && (
        <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl relative overflow-hidden flex flex-col items-center">
            {/* Ambient background glow */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-zinc-100/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Question mark/Search icon */}
            <div className="w-14 h-14 rounded-full bg-zinc-850 border border-zinc-850 flex items-center justify-center text-zinc-400 mb-5">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mb-2">No Such Room Exists</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-8">
              The chat room link you followed is invalid, or the room has expired and been destroyed.
            </p>
            
            <button
              onClick={() => navigate({ to: "/" })}
              className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-white/5 active:scale-[0.98]"
            >
              Go to Home
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/30 shrink-0 relative">
        {/* Left: Connection Status */}
        <div className="flex-1 flex items-center justify-start">
          <div className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-lg px-3 py-1.5">
            <div className={`w-2 h-2 rounded-full ${dataChannelReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'}`} />
            <span className={`text-[10px] sm:text-xs font-semibold tracking-wide ${dataChannelReady ? "text-green-500" : "text-yellow-500"}`}>
              {dataChannelReady ? "Connected" : "Waiting for peer"}
            </span>
          </div>
        </div>

        {/* Center: Timer */}
        {expiresAt && timeRemaining !== null && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-lg px-3 py-1.5 shadow-sm">
              <Clock size={14} className={timeRemaining < 60000 ? "text-red-500 animate-pulse" : "text-zinc-400"} />
              <span className={`text-xs sm:text-sm font-mono tracking-wider ${timeRemaining < 60000 ? "text-red-500 font-bold" : "text-zinc-100"}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        )}
        
        {/* Right: Actions */}
        <div className="flex-1 flex items-center justify-end gap-2 sm:gap-4 z-10">
          <button onClick={handleCopy} title="Share room link" className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors shadow-sm font-semibold text-xs sm:text-sm">
            <Share2 size={16} />
            <span className="hidden sm:block">Share Link</span>
          </button>
          <button onClick={destroyRoom} title="Destroy room" className="p-2 sm:p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {error && error !== "Room is full" && error !== "No such room exists" && error !== "Room not found" && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-4">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-5 bg-zinc-950">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
              <div className={`w-3 h-3 rounded-full ${dataChannelReady ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-zinc-700'}`} />
            </div>
            <p className="text-sm font-medium">
              {dataChannelReady 
                ? "Peer connected. Start the conversation!" 
                : chatState === "connecting" 
                  ? "Connecting to room..." 
                  : chatState === "connecting-to-peer" 
                    ? "Establishing P2P connection..." 
                    : "Waiting for peer to join..."}
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isOwn ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    msg.isOwn
                      ? "bg-zinc-100 text-zinc-950 rounded-br-sm"
                      : "bg-zinc-800 text-zinc-100 rounded-bl-sm border border-zinc-700/50"
                  }`}
                >
                  {!msg.isOwn && (
                    <p className="text-xs text-zinc-400 mb-1.5 font-medium tracking-wide">{msg.sender}</p>
                  )}
                  {msg.isSending ? (
                    <div className="flex items-center gap-3 py-1">
                      <div className="relative flex items-center justify-center">
                        <div className={`w-5 h-5 rounded-full border-2 animate-spin ${
                          msg.isOwn ? 'border-zinc-300 border-t-zinc-950' : 'border-zinc-700 border-t-zinc-200'
                        }`} />
                        <Paperclip size={10} className={msg.isOwn ? 'absolute text-zinc-800' : 'absolute text-zinc-300'} />
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-semibold text-xs tracking-wide ${
                          msg.isOwn ? 'text-zinc-900' : 'text-zinc-100'
                        }`}>
                          Sending file...
                        </span>
                        <span className={`text-[10px] truncate max-w-[180px] font-medium mt-0.5 ${
                          msg.isOwn ? 'text-zinc-600' : 'text-zinc-400'
                        }`}>
                          {msg.fileName}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="break-words whitespace-pre-wrap overflow-hidden leading-relaxed">{msg.content}</p>
                  )}
                  {msg.isFile && msg.fileData && (
                    <a 
                      href={`data:${msg.mimeType || 'application/octet-stream'};base64,${msg.fileData}`} 
                      download={msg.fileName}
                      className={`mt-3 flex items-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors w-fit border shadow-sm ${
                        msg.isOwn 
                          ? "bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800" 
                          : "bg-zinc-700/50 hover:bg-zinc-600 border-zinc-600 text-zinc-200"
                      }`}
                    >
                      <Download size={14} /> Download File
                    </a>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 mt-1.5 px-1 font-medium">
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
      
      {/* Chat Input Section */}
      <div className="shrink-0 p-4 sm:p-5 bg-zinc-950 border-t border-zinc-800/50">
        <div className="flex items-end bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600 transition-all shadow-sm">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!dataChannelReady}
            className="p-3.5 sm:p-4 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-stretch flex items-center justify-center"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>

          <textarea
            placeholder={dataChannelReady ? "Type a message..." : "Waiting for peer..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            rows={1}
            disabled={!dataChannelReady}
            className="flex-1 bg-transparent px-2 py-3.5 sm:py-4 text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none max-h-32 min-h-[48px] no-scrollbar"
          />

          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || !dataChannelReady}
            className="px-5 sm:px-6 text-zinc-900 bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-white transition-colors font-semibold tracking-wide self-stretch flex items-center justify-center"
          >
            Send
          </button>
        </div>
      </div>

      {/* Room Destroyed Modal */}
      {showDestroyModal && (
        <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center transform animate-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Trash icon */}
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-5 animate-pulse">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-zinc-100 mb-2">Room Destroyed</h2>
            <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
              This room no longer exists. Redirecting to home in <span className="text-white font-bold">{countdown}</span>...
            </p>
            <button
              onClick={() => {
                if (destroyIntervalRef.current) {
                  clearInterval(destroyIntervalRef.current);
                }
                navigate({ to: "/" });
              }}
              className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-white/5 active:scale-[0.98]"
            >
              Redirect Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
