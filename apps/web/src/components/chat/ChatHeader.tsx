import { useState } from "react";
import { Trash2, Clock, Copy, Check, Share } from "lucide-react";
import type { ChatHeaderProps } from "@repo/types";
import { AlertDialog } from "../ui/alert-dialog";

export default function ChatHeader({
  dataChannelReady,
  expiresAt,
  timeRemaining,
  formatTime,
  handleCopy,
  isCopied,
  destroyRoom,
  inviteUrl,
  roomCode,
}: ChatHeaderProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  return (
    <div className="px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:p-5 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/30 shrink-0 relative">
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
          onClick={() => {
            if (typeof navigator !== "undefined" && navigator.share) {
              navigator.share({
                title: "Private Chat",
                text: `You've been invited to a Private Chat room.\n\nRoom Code: ${roomCode}\n\nTap the link below to join securely.`,
                url: inviteUrl,
              }).catch(console.error);
            }
          }}
          title="Share room link"
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors shadow-sm font-semibold text-xs sm:text-sm"
        >
          <Share size={16} />
          <span className="hidden sm:block">Share</span>
        </button>
        <button
          onClick={handleCopy}
          title="Copy room link"
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors shadow-sm font-semibold text-xs sm:text-sm"
        >
          {isCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
          <span className="hidden sm:block">{isCopied ? "Copied!" : "Copy"}</span>
        </button>
        <button
          onClick={() => setIsAlertOpen(true)}
          title="Destroy room"
          className="p-2 sm:p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors ml-1"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <AlertDialog
        open={isAlertOpen}
        onOpenChange={setIsAlertOpen}
        title="Destroy Room"
        description="Are you absolutely sure you want to destroy this room? This action is permanent."
        onConfirm={destroyRoom}
        confirmText="Yes, destroy it"
        cancelText="Cancel"
      />
    </div>
  );
}
