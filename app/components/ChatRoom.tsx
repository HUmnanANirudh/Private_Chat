"use client";
import { useState } from "react";
import type { ChatRoomProps } from "../interface";

export default function Chat({roomId}: ChatRoomProps) {
  const [copied, setCopied] = useState(false);
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
  return (
    <div>
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
    </div>
  );
}
