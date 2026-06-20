import type { FileChunkMessage } from "@repo/types";
import type { WebRTCContext } from "@repo/types";

export async function sendFile(context: WebRTCContext, file: File, sender: string): Promise<boolean> {
  if (!context.dataChannel || context.dataChannel.readyState !== "open") {
    console.error("[WebRTC] Data channel not ready for file transfer");
    return false;
  }

  console.log("[WebRTC] Sending file:", file.name, file.size, "bytes");

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      const id = crypto.randomUUID();
      const timestamp = Date.now();
      const CHUNK_SIZE = 16384; // 16KB per chunk
      const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);
      
      const sendChunks = async () => {
        try {
          for (let i = 0; i < totalChunks; i++) {
            while (context.dataChannel && context.dataChannel.bufferedAmount > 65535) {
              await new Promise(r => setTimeout(r, 50));
            }
            
            if (!context.dataChannel || context.dataChannel.readyState !== "open") {
              throw new Error("Data channel closed during file transfer");
            }

            const chunkData = base64.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            const chunkMsg: FileChunkMessage = {
              type: "file-chunk",
              id,
              chunkIndex: i,
              totalChunks,
              data: chunkData,
              name: file.name,
              size: file.size,
              mimeType: file.type,
              sender,
              timestamp
            };
            context.dataChannel.send(JSON.stringify(chunkMsg));
          }
          console.log("[WebRTC] Sent file message:", file.name);
          resolve(true);
        } catch (err) {
          console.error("[WebRTC] Chunk send error:", err);
          resolve(false);
        }
      };
      
      sendChunks();
    };
    reader.onerror = () => resolve(false);
    reader.readAsDataURL(file);
  });
}
