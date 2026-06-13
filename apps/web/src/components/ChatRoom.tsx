import { Paperclip, Video, Share2, Trash2, MessageSquare, Download, Mic, MicOff, VideoOff, PhoneOff, Clock } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ChatRoomProps } from "@repo/types";
import { createChatManager } from "../services";
import type { ChatManagerState } from "../services";
import { VideoPlayer } from "./VideoPlayer";

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
  isOwn: boolean;
  isFile?: boolean;
  fileData?: string;
  fileName?: string;
  mimeType?: string;
}

export default function Chat({ roomId }: ChatRoomProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [chatState, setChatState] = useState<ChatManagerState>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [dataChannelReady, setDataChannelReady] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showDestroyModal, setShowDestroyModal] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingMessagesRef = useRef<string[]>([]);
  const chatManagerRef = useRef<ReturnType<typeof createChatManager> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const showModalRef = useRef(false);

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

  const handleRoomDestroyed = () => {
    if (showModalRef.current) return;
    showModalRef.current = true;
    setShowDestroyModal(true);
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
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
        chatManagerRef.current?.sendTextMessage(content, "You");
      });
      pendingMessagesRef.current = [];
    }
  }, [dataChannelReady]);

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
      }
    } catch (e) {
      console.error("[Chat] Failed to join via API", e);
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

  const destroyRoom = () => {
    chatManagerRef.current?.leaveRoom();
    callDestroyRoom();
    navigate({ to: "/" });
  };

  const leaveRoom = () => {
    chatManagerRef.current?.leaveRoom();
    navigate({ to: "/" });
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // First verify room exists
        const roomRes = await fetch(`/api/v1/room?roomId=${roomId}`, { credentials: "include" });
        if (!roomRes.ok) {
          console.error("[Chat] Room fetch failed", roomRes.status);
          handleRoomDestroyed();
          return;
        }

        const data = await roomRes.json();
        if (data?.Data?.meta?.expiresAt) {
          setExpiresAt(parseInt(data.Data.meta.expiresAt));
        }

        let token = await ensureToken();
        if (!token) token = crypto.randomUUID().slice(0, 16);

        if (!isMounted) return;

        const chatManager = createChatManager({
          onStateChange: (state) => {
            setChatState(state);
            if (state === "connected") {
              setDataChannelReady(true);
            }
            if (state === "idle") {
              handleRoomDestroyed();
            }
          },
          onLocalStream: (stream) => setLocalStream(stream),
          onRemoteStream: (stream) => setRemoteStream(stream),
          onError: (err) => setError(err),
          onPeerDisconnected: () => {
            setRemoteStream(null);
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
          onFileMessage: (message) => {
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

  const handleStartCall = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser blocks camera access. You must use HTTPS or localhost to use video and audio.");
      return;
    }
    if (chatManagerRef.current) {
      await chatManagerRef.current.startMedia();
    }
  };

  const handleToggleAudio = async () => {
    if (!localStream) {
      await handleStartCall();
      if (chatManagerRef.current) {
        chatManagerRef.current.toggleVideo(); // Turn off video since they only asked for audio
        setIsVideoEnabled(false);
      }
      return;
    }
    if (chatManagerRef.current) {
      if (isAudioMuted) chatManagerRef.current.unmuteAudio();
      else chatManagerRef.current.muteAudio();
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const handleToggleVideo = async () => {
    if (!localStream) {
      await handleStartCall();
      if (chatManagerRef.current) {
        chatManagerRef.current.muteAudio(); // Turn off audio since they only asked for video
        setIsAudioMuted(true);
      }
      return;
    }
    if (chatManagerRef.current) {
      chatManagerRef.current.toggleVideo();
      setIsVideoEnabled(!isVideoEnabled);
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
        },
      ]);

      const success = await chatManagerRef.current.sendFile(file, "You");
      
      if (success) {
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId ? {
            ...msg,
            content: `Sent file: ${file.name}`,
            isFile: true,
            fileName: file.name,
          } : msg
        ));
      } else {
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId ? {
            ...msg,
            content: `Failed to send file: ${file.name}`,
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
    const sent = chatManagerRef.current.sendTextMessage(content, "You");
    if (!sent) {
      console.log("[Chat] Data channel not ready, queueing message");
      pendingMessagesRef.current.push(content);
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden relative">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${isChatOpen ? 'md:mr-80' : ''}`}>
        
        {/* Floating Top Info */}
        <div className="absolute top-4 left-4 z-20 flex gap-3">
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            <span className="text-sm font-medium tracking-wide">{roomId}</span>
            <div className="w-px h-4 bg-zinc-700 mx-1" />
            <span className={`text-xs font-semibold ${dataChannelReady ? "text-green-500" : "text-zinc-400"}`}>
              {dataChannelReady ? "SECURE" : "WAITING"}
            </span>
          </div>
          
          {expiresAt && timeRemaining !== null && (
            <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
              <Clock size={16} className={timeRemaining < 60000 ? "text-red-500 animate-pulse" : "text-zinc-400"} />
              <span className={`text-sm font-mono tracking-wider ${timeRemaining < 60000 ? "text-red-500 font-bold" : "text-zinc-100"}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Video Area */}
        <main className="flex-1 relative p-4 pb-24">
          {error && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-4">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <div className="w-full h-full relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl transition-all duration-500">
            {remoteStream ? (
              <VideoPlayer stream={remoteStream} className="w-full h-full object-cover bg-black" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                <VideoOff size={48} className="text-zinc-700 mb-4 opacity-30" />
                <p className="text-lg font-medium text-zinc-600 opacity-60">
                  {chatState === "connecting" || chatState === "idle" ? "Connecting to room..." : "Waiting for peer..."}
                </p>
              </div>
            )}
            
            <div className={`absolute bottom-6 right-6 ${remoteStream ? "w-64 h-48 border border-zinc-700 shadow-2xl" : "w-full h-full inset-0 border-0"} rounded-xl overflow-hidden bg-zinc-950 z-10 transition-all duration-500`}>
              {localStream ? (
                <VideoPlayer stream={localStream} muted className={`w-full h-full ${remoteStream ? 'object-cover' : 'object-contain'}`} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                  <VideoOff size={48} className="text-zinc-700 opacity-30" />
                </div>
              )}
              {isAudioMuted && localStream && (
                <div className="absolute top-3 right-3 bg-red-500 p-1.5 rounded-full shadow-lg z-20">
                  <MicOff size={14} className="text-white" />
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Bottom Control Bar */}
        <div className="h-24 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/50 flex items-center justify-between px-8 absolute bottom-0 left-0 right-0 z-20">
          
          <div className="flex-1 flex items-center gap-4">
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-medium text-zinc-100">{timeRemaining ? formatTime(timeRemaining) : "--:--:--"}</span>
              <span className="text-xs text-zinc-500 font-mono">{roomId}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={handleToggleAudio}
              title={(!localStream || isAudioMuted) ? "Turn on microphone" : "Turn off microphone"}
              className={`p-4 rounded-full transition-all duration-200 ${(!localStream || isAudioMuted) ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'}`}
            >
              {(!localStream || isAudioMuted) ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            
            <button 
              onClick={handleToggleVideo}
              title={(!localStream || !isVideoEnabled) ? "Turn on camera" : "Turn off camera"}
              className={`p-4 rounded-full transition-all duration-200 ${(!localStream || !isVideoEnabled) ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'}`}
            >
              {(!localStream || !isVideoEnabled) ? <VideoOff size={22} /> : <Video size={22} />}
            </button>

            <button 
              onClick={leaveRoom}
              title="Leave room"
              className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all duration-200 ml-2"
            >
              <PhoneOff size={22} />
            </button>
            <button 
              onClick={destroyRoom}
              title="Destroy room for everyone"
              className="p-4 rounded-full bg-red-950 hover:bg-red-900 border border-red-900 text-red-200 shadow-lg transition-all duration-200 ml-2"
            >
              <Trash2 size={22} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-end gap-3">
            <button
              onClick={handleCopy}
              title="Share room link"
              className="p-3 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              <Share2 size={20} />
            </button>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              title="Toggle chat panel"
              className={`p-3 rounded-full transition-colors ${isChatOpen ? 'bg-white text-black shadow-lg' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'}`}
            >
              <MessageSquare size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <aside className={`w-80 bg-zinc-950 border-l border-zinc-800/50 flex flex-col absolute top-0 bottom-0 right-0 transform transition-transform duration-300 ease-in-out z-30 shadow-2xl ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/30">
          <h2 className="font-semibold text-sm tracking-wide text-zinc-100">In-call messages</h2>
          <button onClick={() => setIsChatOpen(false)} className="md:hidden text-zinc-400 hover:text-white">
            <Share2 size={16} className="rotate-45" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-zinc-950">
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
                        ? "bg-zinc-100 text-zinc-900 rounded-br-md"
                        : "bg-zinc-800 text-zinc-100 rounded-bl-md border border-zinc-700"
                    }`}
                  >
                    {!msg.isOwn && (
                      <p className="text-xs text-zinc-400 mb-1 font-medium">{msg.sender}</p>
                    )}
                    <p className="break-all whitespace-pre-wrap">{msg.content}</p>
                    {msg.isFile && msg.fileData && (
                      <a 
                        href={`data:${msg.mimeType || 'application/octet-stream'};base64,${msg.fileData}`} 
                        download={msg.fileName}
                        className={`mt-2 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-colors w-fit border ${
                          msg.isOwn ? "bg-zinc-200/50 hover:bg-zinc-200 border-zinc-300" : "bg-zinc-700/50 hover:bg-zinc-600 border-zinc-600"
                        }`}
                      >
                        <Download size={14} /> Download File
                      </a>
                    )}
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
        
        {/* Chat Input Section */}
        <div className="shrink-0 p-4 bg-zinc-950 border-t border-zinc-800/50">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-zinc-600 transition-colors shadow-inner">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>

            <input
              type="text"
              placeholder="Send a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              className="flex-1 bg-transparent px-2 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />

            <button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-colors"
            >
              <MessageSquare size={18} className="rotate-0" />
            </button>
          </div>
        </div>
      </aside>

      {/* Room Destroyed Modal */}
      {showDestroyModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center transform animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <PhoneOff size={32} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2">Room Destroyed</h2>
            <p className="text-zinc-400 mb-8">
              This room no longer exists. Redirecting to home in <span className="text-white font-bold">{countdown}</span>...
            </p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg"
            >
              Redirect Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
