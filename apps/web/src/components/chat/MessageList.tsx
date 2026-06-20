import { Paperclip, Download } from "lucide-react";
import type { MessageListProps } from "@repo/types";

export default function MessageList({
  messages,
  dataChannelReady,
  chatState,
  messagesEndRef,
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-5 bg-zinc-950">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
            <div
              className={`w-3 h-3 rounded-full ${
                dataChannelReady
                  ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse"
                  : "bg-zinc-700"
              }`}
            />
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
                  <p className="text-xs text-zinc-400 mb-1.5 font-medium tracking-wide">
                    {msg.sender}
                  </p>
                )}
                {msg.isSending ? (
                  <div className="flex items-center gap-3 py-1">
                    <div className="relative flex items-center justify-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 animate-spin ${
                          msg.isOwn
                            ? "border-zinc-300 border-t-zinc-950"
                            : "border-zinc-700 border-t-zinc-200"
                        }`}
                      />
                      <Paperclip
                        size={10}
                        className={msg.isOwn ? "absolute text-zinc-800" : "absolute text-zinc-300"}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`font-semibold text-xs tracking-wide ${
                          msg.isOwn ? "text-zinc-900" : "text-zinc-100"
                        }`}
                      >
                        Sending file...
                      </span>
                      <span
                        className={`text-[10px] truncate max-w-[180px] font-medium mt-0.5 ${
                          msg.isOwn ? "text-zinc-600" : "text-zinc-400"
                        }`}
                      >
                        {msg.fileName}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="break-words whitespace-pre-wrap overflow-hidden leading-relaxed">
                    {msg.content}
                  </p>
                )}
                {msg.isFile && msg.fileData && (
                  <a
                    href={`data:${msg.mimeType || "application/octet-stream"};base64,${msg.fileData}`}
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
  );
}
