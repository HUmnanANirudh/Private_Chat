import { Paperclip, Phone, Video, Share2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import type { ChatRoomProps } from "@repo/types";
import { createChatManager  } from "../services";
import type {ChatManagerState} from "../services";
import { VideoPlayer } from "./VideoPlayer";

export default function Chat({ roomId }: ChatRoomProps) {
  const [input, setInput] = useState("");
  const [chatState, setChatState] = useState<ChatManagerState>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chatManagerRef = useRef<ReturnType<typeof createChatManager> | null>(null);

  // Get token from cookie (stored when user joined room via API)
  const getToken = () => {
    const match = document.cookie.match(/x-auth-value=([^;]+)/);
    return match ? match[1] : "";
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError("No authentication token found");
      return;
    }

    // Create chat manager
    const chatManager = createChatManager({
      onStateChange: (state) => {
        setChatState(state);
        console.log("[Chat] State changed to:", state);
      },
      onLocalStream: (stream) => {
        console.log("[Chat] Local stream available");
        setLocalStream(stream);
      },
      onRemoteStream: (stream) => {
        console.log("[Chat] Remote stream available");
        setRemoteStream(stream);
      },
      onError: (err) => {
        console.error("[Chat] Error:", err);
        setError(err);
      },
      onPeerDisconnected: () => {
        console.log("[Chat] Peer disconnected");
        setRemoteStream(null);
      },
    });

    chatManagerRef.current = chatManager;

    // Join room
    chatManager.joinRoom(roomId, token).catch((err) => {
      console.error("[Chat] Failed to join room:", err);
      setError("Failed to join room");
    });

    // Cleanup on unmount
    return () => {
      chatManager.leaveRoom();
    };
  }, [roomId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const destroyRoom = () => {
    chatManagerRef.current?.leaveRoom();
    console.log("Room destroyed");
  };

  // Static time remaining display (1 hour for demo)
  const TimeRemaining = 3600;

  const renderVideoSection = () => {
    if (chatState === "idle" || chatState === "connecting") {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-12 h-12 border-4 border-zinc-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-zinc-500">Connecting to room...</p>
        </div>
      );
    }

    if (chatState === "waiting") {
      return (
        <div className="flex flex-col items-center justify-center h-full opacity-60">
          <div className="w-12 h-12 border-4 border-zinc-600 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-xl font-bold mt-4">Waiting for peer...</h2>
          <p className="text-sm text-zinc-500">Share the room link to invite someone</p>
        </div>
      );
    }

    if (chatState === "connected" && remoteStream) {
      return (
        <div className="relative w-full h-full">
          <VideoPlayer stream={remoteStream} className="w-full h-full object-cover rounded-xl" />
          {localStream && (
            <div className="absolute bottom-4 right-4 w-48 h-36 border-2 border-zinc-700 rounded-xl overflow-hidden shadow-lg">
              <VideoPlayer stream={localStream} muted className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      );
    }

    if (chatState === "connected") {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-xl font-bold mt-4 text-green-500">Connected!</h2>
          <p className="text-sm text-zinc-500">Setting up video...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full opacity-20 grayscale">
        <h2 className="text-xl font-bold mt-4">Room Empty</h2>
        <p className="text-sm">Waiting for participants...</p>
      </div>
    );
  };

  return (
    <div className="md:max-w-lg mx-auto bg-zinc-950 text-zinc-100 min-h-screen border-x border-zinc-800 shadow-2xl">
      <header className="flex items-center justify-between gap-3 p-4 w-full border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
            Secure Room
          </span>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-zinc-100 text-sm font-mono truncate max-w-25">
              {roomId}
            </span>

            <button
              onClick={handleCopy}
              className="p-1 text-zinc-400 hover:text-zinc-100 transition-colors"
              title="Copy link"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center text-[10px] uppercase tracking-widest text-zinc-500 font-bold gap-1">
            <span>Destruct</span>
            <span className="font-mono text-red-500 text-sm">
              {formatTime(TimeRemaining)}
            </span>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          <button
            onClick={() => destroyRoom()}
            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-all duration-300"
            title="Destroy Room"
          >
            <Video size={18} />
          </button>
        </div>
      </header>

      <main className="flex flex-col h-[calc(100vh-140px)]">
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          <div className="h-full min-h-75">
            {renderVideoSection()}
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4 bg-zinc-900/50 backdrop-blur-md border-t border-zinc-800">
          <div className="flex items-end gap-2">
            <button
              className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 rounded-xl transition-all"
              title="Attach file"
            >
              <Paperclip size={20} />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Secure message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && input.trim()) {
                    console.log("Sending message:", input);
                    setInput("");
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100
               focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            <button
              disabled={!input.trim()}
              onClick={() => {
                if (input.trim().length === 0) return;
                console.log("Sending message:", input);
                setInput("");
              }}
              className={`p-3 rounded-xl font-bold transition-all active:scale-95
    ${
      !input.trim()
        ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
        : "bg-zinc-100 text-zinc-900 hover:bg-white"
    }
  `}
            >
              Send
            </button>
          </div>

          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-zinc-800/50">
            <button className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-100 transition-colors group">
              <div className="p-2 bg-zinc-800 group-hover:bg-zinc-700 rounded-lg">
                <Phone size={18} />
              </div>
              <span className="text-[9px] uppercase tracking-tighter">Audio</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-100 transition-colors group">
              <div className="p-2 bg-zinc-800 group-hover:bg-zinc-700 rounded-lg">
                <Video size={18} />
              </div>
              <span className="text-[9px] uppercase tracking-tighter">Video</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-100 transition-colors group">
              <div className="p-2 bg-zinc-800 group-hover:bg-zinc-700 rounded-lg">
                <Share2 size={18} />
              </div>
              <span className="text-[9px] uppercase tracking-tighter">Share</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}