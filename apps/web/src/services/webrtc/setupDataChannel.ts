import type { FileChunkMessage, FileMessage, DataChannelMessage } from "@repo/types";
import type { WebRTCContext } from "@repo/types";

export function setupDataChannel(context: WebRTCContext, channel: RTCDataChannel) {
  console.log("[WebRTC] Setting up data channel:", channel.label, "readyState:", channel.readyState);

  context.dataChannelState = channel.readyState === "open" ? "open" : "connecting";

  channel.onopen = () => {
    context.dataChannelState = "open";
    console.log("[WebRTC] Data channel OPENED!");
    context.onDataChannelStateChange?.("open");
  };

  channel.onclose = () => {
    context.dataChannelState = "closed";
    console.log("[WebRTC] Data channel closed");
    context.onDataChannelStateChange?.("closed");
  };

  channel.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      
      if (message.type === "file-chunk") {
        const chunkMsg = message as FileChunkMessage;
        if (!context.fileBuffers.has(chunkMsg.id)) {
          context.fileBuffers.set(chunkMsg.id, new Array(chunkMsg.totalChunks));
        }
        const buffer = context.fileBuffers.get(chunkMsg.id)!;
        buffer[chunkMsg.chunkIndex] = chunkMsg.data;

        let complete = true;
        for (let i = 0; i < chunkMsg.totalChunks; i++) {
          if (!(i in buffer)) {
            complete = false;
            break;
          }
        }

        if (complete) {
          const fullBase64 = buffer.join("");
          context.fileBuffers.delete(chunkMsg.id);
          
          const fileMessage: FileMessage = {
            type: "file",
            id: chunkMsg.id,
            name: chunkMsg.name,
            size: chunkMsg.size,
            mimeType: chunkMsg.mimeType,
            data: fullBase64,
            sender: chunkMsg.sender,
            timestamp: chunkMsg.timestamp
          };
          context.onDataChannelMessage?.(fileMessage);
        }
      } else {
        context.onDataChannelMessage?.(message as DataChannelMessage);
      }
    } catch (err) {
      console.error("[WebRTC] Failed to parse data channel message:", err);
    }
  };

  channel.onerror = (error) => {
    console.error("[WebRTC] Data channel error:", error);
    context.dataChannelState = "error";
  };

  context.dataChannelState = channel.readyState;

  if (channel.readyState === "open") {
    console.log("[WebRTC] Data channel already open on setup!");
    context.dataChannelState = "open";
    context.onDataChannelStateChange?.("open");
  }

  console.log("[WebRTC] Data channel setup complete, current state:", channel.readyState);
}
