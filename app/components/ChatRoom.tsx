"use client";
import { useMutation } from "@tanstack/react-query";
import { Paperclip } from "lucide-react";
import { useState } from "react";
import type { ChatRoomProps } from "../interface";
import { client } from "../lib/client";
import { set } from "zod";

export default function Chat({ roomId }: ChatRoomProps) {
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState("");
  const timeLeft = 600;
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
  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ newMessage }: { newMessage: string }) => {
      const userName = localStorage.getItem("userName") as string;
      await client.messages.messages.post(
        { sender: userName, content: newMessage },
        { query: { roomId: roomId as string } }
      );
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
            {formatTime(timeLeft)}
          </span>
        </div>
        <button
          className="px-3 py-1.5 text-xs sm:text-sm
               bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95
               rounded font-medium whitespace-nowrap
               transition duration-300 ease-in-out"
        >
          Destroy Now
        </button>
      </header>
      <main className="flex flex-col h-[calc(100vh-80px)]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4" />
        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-end gap-2">
            <button
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
              title="Attach file"
            >
              <Paperclip size={20} />
            </button>
            <textarea
              placeholder="Type your message..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm resize-none focus:outline-none focus:border-zinc-700 max-h-32"
              rows={1}
              aria-label="Input"
              onChange={(e) => setInput(e.target.value)}
              onInput={(e) => {
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height =
                  Math.min(e.currentTarget.scrollHeight, 128) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  sendMessage({ newMessage: input });
                }
              }}
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
