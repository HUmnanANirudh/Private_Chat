import type { FileMessage, DataChannelMessage } from "@repo/types";
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

  channel.binaryType = "arraybuffer";

  channel.onmessage = (event) => {
    try {
      if (event.data instanceof ArrayBuffer) {
        const buffer = new Uint8Array(event.data);
        const decoder = new TextDecoder();
        const id = decoder.decode(buffer.slice(0, 36));
        const chunkData = buffer.slice(36);
        
        if (!context.fileBuffers.has(id)) {
          context.fileBuffers.set(id, { chunks: [], receivedSize: 0 });
        }
        
        const fileState = context.fileBuffers.get(id)!;
        fileState.chunks.push(chunkData);
        fileState.receivedSize += chunkData.length;

        const metadata = context.fileMetadata.get(id);
        if (metadata && fileState.receivedSize >= metadata.size) {
          const blob = new Blob(fileState.chunks as BlobPart[], { type: metadata.mimeType });
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            const fileMessage: FileMessage = {
              type: "file",
              id: metadata.id,
              name: metadata.name,
              size: metadata.size,
              mimeType: metadata.mimeType,
              data: base64,
              sender: metadata.sender,
              timestamp: metadata.timestamp
            };
            context.onDataChannelMessage?.(fileMessage);
            context.fileBuffers.delete(id);
            context.fileMetadata.delete(id);
          };
          reader.readAsDataURL(blob);
        }
      } else {
        const message = JSON.parse(event.data);
        if (message.type === "file-metadata") {
          context.fileMetadata.set(message.id, message);
          
          const fileState = context.fileBuffers.get(message.id);
          if (fileState && fileState.receivedSize >= message.size) {
          const blob = new Blob(fileState.chunks as BlobPart[], { type: message.mimeType });
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(",")[1];
              const fileMessage: FileMessage = {
                type: "file",
                id: message.id,
                name: message.name,
                size: message.size,
                mimeType: message.mimeType,
                data: base64,
                sender: message.sender,
                timestamp: message.timestamp
              };
              context.onDataChannelMessage?.(fileMessage);
              context.fileBuffers.delete(message.id);
              context.fileMetadata.delete(message.id);
            };
            reader.readAsDataURL(blob);
          }
        } else {
          context.onDataChannelMessage?.(message as DataChannelMessage);
        }
      }
    } catch (err) {
      console.error("[WebRTC] Failed to handle data channel message:", err);
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
