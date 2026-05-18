const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    if(server.upgrade(req)) {
      return;
    }
    return new Response("Hello World");
  },
  websocket: {
    open(ws) {
      console.log("WebSocket opened");
    },
    message(ws, message) {
      console.log("Received message:", message);
      ws.send(`Echo: ${message}`);
    },
    close(ws, code, reason) {
      console.log(`WebSocket closed: ${code} - ${reason}`);
    },
  },
});

console.log(`WebSocket server running at ws://localhost:${server.port}`);

