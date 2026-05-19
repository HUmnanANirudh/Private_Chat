// Signaling Service - Connects WebRTC to WebSocket server
// Handles the signaling phase: exchanging offers/answers/ICE candidates

export type SignalingMessage =
  | { type: "join_room"; roomId: string; token: string }
  | { type: "offer"; offer: RTCSessionDescriptionInit; to: string }
  | { type: "answer"; answer: RTCSessionDescriptionInit; to: string }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit; to: string }
  | { type: "peer-disconnect"; roomId: string; token: string };

export type IncomingSignalingMessage =
  | { type: "ready" }
  | { type: "offer"; data: RTCSessionDescriptionInit; from: string }
  | { type: "answer"; data: RTCSessionDescriptionInit; from: string }
  | { type: "ice-candidate"; data: RTCIceCandidateInit; from: string }
  | { type: "peer-disconnect"; from: string }
  | { type: "error"; message: string };

export interface SignalingCallbacks {
  onPeerJoined?: (data: { token: string }) => void;
  onReady?: () => void;
  onOffer?: (data: { offer: RTCSessionDescriptionInit; from: string }) => void;
  onAnswer?: (data: { answer: RTCSessionDescriptionInit; from: string }) => void;
  onIceCandidate?: (data: { candidate: RTCIceCandidateInit; from: string }) => void;
  onPeerDisconnected?: (data: { token: string }) => void;
  onError?: (error: string) => void;
}

export interface SignalingService {
  isConnected: boolean;

  connect: (roomId: string, token: string) => void;
  disconnect: () => void;

  sendOffer: (offer: RTCSessionDescriptionInit, to: string) => void;
  sendAnswer: (answer: RTCSessionDescriptionInit, to: string) => void;
  sendIceCandidate: (candidate: RTCIceCandidateInit, to: string) => void;
  sendPeerDisconnect: (roomId: string, token: string) => void;
}

export function createSignalingService(callbacks: SignalingCallbacks): SignalingService {
  let ws: WebSocket | null = null;
  let isConnected = false;

  return {
    get isConnected() {
      return isConnected;
    },

    connect(roomId: string, token: string) {
      console.log(`[Signaling] Connecting to ws://localhost:9001?roomId=${roomId}`);

      // Connect to WebSocket server - token is passed as query param since cookies aren't auto-sent
      const socket = new WebSocket(`ws://localhost:9001?roomId=${roomId}&token=${token}`);

      socket.onopen = () => {
        console.log("[Signaling] WebSocket connected");
        isConnected = true;
        ws = socket;

        // Send join_room message
        const joinMessage: SignalingMessage = {
          type: "join_room",
          roomId,
          token,
        };
        socket.send(JSON.stringify(joinMessage));
        console.log("[Signaling] Sent join_room message");
      };

      socket.onmessage = (event) => {
        try {
          const message: IncomingSignalingMessage = JSON.parse(event.data);
          console.log("[Signaling] Received message:", message.type);

          switch (message.type) {
            case "ready":
              console.log("[Signaling] Both peers ready, can start WebRTC");
              callbacks.onReady?.();
              break;

            case "offer":
              console.log("[Signaling] Received offer from:", message.from);
              callbacks.onOffer?.({
                offer: message.data,
                from: message.from,
              });
              break;

            case "answer":
              console.log("[Signaling] Received answer from:", message.from);
              callbacks.onAnswer?.({
                answer: message.data,
                from: message.from,
              });
              break;

            case "ice-candidate":
              console.log("[Signaling] Received ICE candidate from:", message.from);
              callbacks.onIceCandidate?.({
                candidate: message.data,
                from: message.from,
              });
              break;

            case "peer-disconnect":
              console.log("[Signaling] Peer disconnected:", message.from);
              callbacks.onPeerDisconnected?.({ token: message.from });
              break;

            case "error":
              console.error("[Signaling] Error from server:", message.message);
              callbacks.onError?.(message.message);
              break;

            default:
              console.warn("[Signaling] Unknown message type:", (message as any).type);
          }
        } catch (err) {
          console.error("[Signaling] Failed to parse message:", err);
        }
      };

      socket.onerror = (error) => {
        console.error("[Signaling] WebSocket error:", error);
        callbacks.onError?.("WebSocket connection error");
      };

      socket.onclose = (event) => {
        console.log(`[Signaling] WebSocket closed: ${event.code} ${event.reason}`);
        isConnected = false;
        ws = null;
      };
    },

    disconnect() {
      console.log("[Signaling] Disconnecting...");
      if (ws) {
        ws.close();
        ws = null;
        isConnected = false;
      }
    },

    sendOffer(offer: RTCSessionDescriptionInit, _to: string) {
      if (!ws || !isConnected) {
        console.error("[Signaling] Cannot send offer - not connected");
        return;
      }
      const message: SignalingMessage = {
        type: "offer",
        offer,
        to: "",
      };
      ws.send(JSON.stringify(message));
      console.log("[Signaling] Sent offer");
    },

    sendAnswer(answer: RTCSessionDescriptionInit, _to: string) {
      if (!ws || !isConnected) {
        console.error("[Signaling] Cannot send answer - not connected");
        return;
      }
      const message: SignalingMessage = {
        type: "answer",
        answer,
        to: "",
      };
      ws.send(JSON.stringify(message));
      console.log("[Signaling] Sent answer");
    },

    sendIceCandidate(candidate: RTCIceCandidateInit, _to: string) {
      if (!ws || !isConnected) {
        console.error("[Signaling] Cannot send ICE candidate - not connected");
        return;
      }
      const message: SignalingMessage = {
        type: "ice-candidate",
        candidate,
        to: "",
      };
      ws.send(JSON.stringify(message));
      console.log("[Signaling] Sent ICE candidate");
    },

    sendPeerDisconnect(roomId: string, token: string) {
      if (!ws || !isConnected) {
        console.error("[Signaling] Cannot send disconnect - not connected");
        return;
      }
      const message: SignalingMessage = {
        type: "peer-disconnect",
        roomId,
        token,
      };
      ws.send(JSON.stringify(message));
      console.log("[Signaling] Sent peer-disconnect");
    },
  };
}