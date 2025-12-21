"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import type { ChatRoomProps } from "../interface";
import { client } from "../lib/client";
import { useRealtime } from "../lib/realtime-client";
export default function Chat({ roomId }: ChatRoomProps) {
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState("");
  const [expireAt, setExpireAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const router = useRouter();
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

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.messages.get({
        query: { roomId: roomId as string },
      });
      return res.data?.messages;
    },
  });
  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ newMessage }: { newMessage: string }) => {
      const userName = localStorage.getItem("username");
      await client.messages.messages.post(
        { sender: String(userName), content: newMessage },
        { query: { roomId: roomId as string } }
      );
    },
  });
  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({
        query: { roomId: roomId as string },
      });
      return res.data;
    },
  });
  useEffect(() => {
    if (ttlData?.expireAt && expireAt === null) {
      setExpireAt(ttlData.expireAt);
    }
  }, [ttlData?.expireAt, expireAt]);
  useEffect(() => {
    if (!expireAt) return;

    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);

      if (current >= expireAt) {
        clearInterval(interval);
        router.push("/errors/room-destroyed");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expireAt, router]);

  const TimeRemaining =
    expireAt !== null ? Math.max(0, Math.floor((expireAt - now) / 1000)) : null;
  const { mutate: destroyRoom } = useMutation({
    mutationFn: async () => {
      await client.room.delete(null, { query: { roomId: roomId as string } });
    },
  });
  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy"],
    onData: ({ event }) => {
      if (event === "chat.message") {
        refetch();
      }
      if (event === "chat.destroy") {
        router.push("/errors/room-destroyed");
      }
    },
  });

  return (
    <div className="md:max-w-lg mx-auto">
      <header className="flex items-center justify-between gap-3 p-3 w-full">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs text-gray-400 whitespace-nowrap">
            Room ID
          </span>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-amber-50 text-sm truncate max-w-sm sm:max-w-45">
              {roomId}
            </span>

            <button
              onClick={handleCopy}
              className="px-2 py-1 text-xs bg-neutral-700 rounded
                   transition active:scale-90 hover:bg-neutral-600
                   whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center text-xs text-gray-400 whitespace-nowrap gap-1">
          <span>Self destruct</span>
          <span className="font-mono text-red-400 text-sm sm:text-base">
            {formatTime(TimeRemaining ?? 0)}
          </span>
        </div>
        <button
          onClick={() => destroyRoom()}
          className="px-3 py-1.5 text-xs sm:text-sm
               bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95
               rounded font-medium whitespace-nowrap
               transition duration-300 ease-in-out"
        >
          Destroy Now
        </button>
      </header>

      <main className="flex flex-col h-[calc(100vh-80px)]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages?.map((msg: any) => {
            const isMe = !!msg.token;

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-xl px-3 py-2 text-sm
            ${
              isMe
                ? "bg-amber-500 text-black rounded-br-sm"
                : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
            }`}
                >
                  {!isMe && (
                    <div className="text-xs text-zinc-400 mb-0.5">
                      {msg.sender}
                    </div>
                  )}

                  <div className="wrap-break-word">{msg.content}</div>

                  <div className="text-[10px] text-right text-zinc-400 mt-1">
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
        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-end gap-2">
            <button
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
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
                if (e.key === "Enter" && input.trim()) {
                  sendMessage({ newMessage: input });
                  setInput("");
                }
              }}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm
             focus:outline-none focus:border-zinc-700"
            />

            <button
              disabled={!input.trim() || isPending}
              onClick={() => {
                if (input.trim().length === 0) return;
                sendMessage({ newMessage: input });
                setInput("");
              }}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition active:scale-95
    ${
      isPending
        ? "bg-zinc-700 text-zinc-400 opacity-60 cursor-not-allowed active:scale-100"
        : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
    }
  `}
            >
              {isPending && (
                <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              )}
              {isPending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
