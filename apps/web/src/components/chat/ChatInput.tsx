import type { ChatInputProps } from "@repo/types";
import AttachmentMenu from "./AttachmentMenu";

export default function ChatInput({
  input,
  setInput,
  dataChannelReady,
  handleFileChange,
  handleSendMessage,
}: ChatInputProps) {
  return (
    <div className="shrink-0 pt-4 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5 bg-zinc-950 border-t border-zinc-800/50">
      <div className="flex items-end bg-zinc-900 border border-zinc-800 rounded-2xl focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600 transition-all shadow-sm">
        
        <AttachmentMenu disabled={!dataChannelReady} onFileChange={handleFileChange} />

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
          className="px-5 sm:px-6 text-zinc-900 bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-white transition-colors font-semibold tracking-wide self-stretch flex items-center justify-center rounded-r-2xl"
        >
          Send
        </button>
      </div>
    </div>
  );
}
