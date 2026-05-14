import { useMutation, useQuery } from "@tanstack/react-query";
import { Paperclip, Phone, Video, Share2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ChatRoomProps } from "@repo/types";

export default function Chat({ roomId }: ChatRoomProps) {
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const navigate = useNavigate();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Placeholders for new signaling logic
  const messages: any[] = []; 
  const isPending = false;
  const sendMessage = (data: any) => console.log("Sending:", data);
  const destroyRoom = () => console.log("Destroying room");

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);

      if (current >= expiresAt) {
        clearInterval(interval);
        navigate({ to: "/errors/room-destroyed" });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, navigate]);

  const TimeRemaining =
    expiresAt !== null ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null;

  return (
    <div className="md:max-w-lg mx-auto bg-zinc-950 text-zinc-100 min-h-screen border-x border-zinc-800 shadow-2xl">
      <header className="flex items-center justify-between gap-3 p-4 w-full border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
            Secure Room
          </span>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-zinc-100 text-sm font-mono truncate max-w-[100px]">
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
              {formatTime(TimeRemaining ?? 0)}
            </span>
          </div>

          <div className="h-8 w-[1px] bg-zinc-800" />

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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-20 grayscale">
               <h2 className="text-xl font-bold mt-4">Room Empty</h2>
               <p className="text-sm">Waiting for participants...</p>
            </div>
          )}

          {messages.map((msg: any) => {
            const isMe = !!msg.token;

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm
            ${
              isMe
                ? "bg-zinc-100 text-zinc-900 rounded-tr-none"
                : "bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700"
            }`}
                >
                  {!isMe && (
                    <div className="text-[10px] font-bold uppercase tracking-tight text-zinc-400 mb-1">
                      {msg.sender}
                    </div>
                  )}

                  <div className="break-words leading-relaxed">{msg.content}</div>

                  <div className={`text-[9px] mt-1 opacity-50 ${isMe ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-zinc-900/50 backdrop-blur-md border-t border-zinc-800">
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
                    sendMessage({ newMessage: input });
                    setInput("");
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100
               focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            <button
              disabled={!input.trim() || isPending}
              onClick={() => {
                if (input.trim().length === 0) return;
                sendMessage({ newMessage: input });
                setInput("");
              }}
              className={`p-3 rounded-xl font-bold transition-all active:scale-95
    ${
      isPending || !input.trim()
        ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
        : "bg-zinc-100 text-zinc-900 hover:bg-white"
    }
  `}
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                "Send"
              )}
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
