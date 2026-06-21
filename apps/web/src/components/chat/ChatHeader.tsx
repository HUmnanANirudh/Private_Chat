import { Trash2, Clock, Copy, Check } from "lucide-react";
import type { ChatHeaderProps } from "@repo/types";

export default function ChatHeader({
  dataChannelReady,
  expiresAt,
  timeRemaining,
  formatTime,
  handleCopy,
  isCopied,
  destroyRoom,
}: ChatHeaderProps) {
  return (
    <div className="p-4 sm:p-5 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/30 shrink-0 relative">
      {/* Left: Connection Status */}
      <div className="flex-1 flex items-center justify-start">
        <div className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-lg px-3 py-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              dataChannelReady
                ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"
                : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"
            }`}
          />
          <span
            className={`text-[10px] sm:text-xs font-semibold tracking-wide ${
              dataChannelReady ? "text-green-500" : "text-yellow-500"
            }`}
          >
            {dataChannelReady ? "Connected" : "Waiting for peer"}
          </span>
        </div>
      </div>
      {expiresAt && timeRemaining !== null && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-lg px-3 py-1.5 shadow-sm">
            <Clock
              size={14}
              className={timeRemaining < 60000 ? "text-red-500 animate-pulse" : "text-zinc-400"}
            />
            <span
              className={`text-xs sm:text-sm font-mono tracking-wider ${
                timeRemaining < 60000 ? "text-red-500 font-bold" : "text-zinc-100"
              }`}
            >
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      )}
      <div className="flex-1 flex items-center justify-end gap-2 sm:gap-4 z-10">
        <button
          onClick={handleCopy}
          title="Copy room link"
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors shadow-sm font-semibold text-xs sm:text-sm"
        >
          {isCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
          <span className="hidden sm:block">{isCopied ? "Copied!" : "Copy Link"}</span>
        </button>
        <button
          onClick={destroyRoom}
          title="Destroy room"
          className="p-2 sm:p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
