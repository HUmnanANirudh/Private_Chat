import type { ServerWebSocket } from "bun";

export type WSData = {
    token: string | null;
}

export const websocketHandlers = {
    open: (ws: ServerWebSocket<WSData>) => {
        console.log("WebSocket connection opened");
        console.log("Token from data:", ws.data.token);
        
        ws.send("Welcome to the signaling server!");
    },
    message: (ws: ServerWebSocket<WSData>, message: string | Buffer) => {
        console.log("Received message:", message.toString());
        ws.send(`Echo: ${message}`);
    },
    close: (ws: ServerWebSocket<WSData>, code: number, reason: string) => {
        console.log(`WebSocket connection closed. Code: ${code}, Reason: ${reason}`);
    },
    error: (ws: ServerWebSocket<WSData>, error: Error) => {
        console.error("WebSocket error:", error);
    },
}; 