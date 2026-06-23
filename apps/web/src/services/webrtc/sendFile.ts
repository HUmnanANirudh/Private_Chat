import type { WebRTCContext } from "@repo/types";

export async function sendFile(context: WebRTCContext, file: File, sender: string): Promise<boolean> {
  if (!context.dataChannel || context.dataChannel.readyState !== "open") {
    console.error("[WebRTC] Data channel not ready for file transfer");
    return false;
  }

  console.log("[WebRTC] Sending file:", file.name, file.size, "bytes");

  return new Promise((resolve) => {
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    
    const metadataMsg = {
      type: "file-metadata",
      id,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      sender,
      timestamp
    };
    context.dataChannel!.send(JSON.stringify(metadataMsg));

    const reader = new FileReader();
    reader.onload = async () => {
      const buffer = reader.result as ArrayBuffer;
      const CHUNK_SIZE = 16384; 
      const totalChunks = Math.ceil(buffer.byteLength / CHUNK_SIZE);
      const encoder = new TextEncoder();
      const idBytes = encoder.encode(id); 

      try {
        for (let i = 0; i < totalChunks; i++) {
          while (context.dataChannel && context.dataChannel.bufferedAmount > 65535) {
            await new Promise(r => setTimeout(r, 50));
          }
          
          if (!context.dataChannel || context.dataChannel.readyState !== "open") {
            throw new Error("Data channel closed during file transfer");
          }

          const chunk = buffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          const chunkBuffer = new Uint8Array(idBytes.length + chunk.byteLength);
          chunkBuffer.set(idBytes, 0);
          chunkBuffer.set(new Uint8Array(chunk), idBytes.length);
          
          context.dataChannel.send(chunkBuffer);
        }
        console.log("[WebRTC] Sent file completely:", file.name);
        resolve(true);
      } catch (err) {
        console.error("[WebRTC] Chunk send error:", err);
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file);
  });
}
