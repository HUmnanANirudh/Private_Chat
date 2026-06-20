export function disconnect(context: { ws: WebSocket | null; isConnected: boolean }) {
  console.log("[Signaling] Disconnecting...");
  if (context.ws) {
    context.ws.close();
    context.ws = null;
    context.isConnected = false;
  }
}
