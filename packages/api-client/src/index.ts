import axios from 'axios';
import type { SignalingMessage } from '@repo/types';

export let API_BASE = 'http://localhost:9000';
export let WS_BASE = 'ws://localhost:9001';

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const configureApiClient = (config: { apiUrl?: string; wsUrl?: string }) => {
  if (config.apiUrl) {
    API_BASE = config.apiUrl;
    apiClient.defaults.baseURL = API_BASE;
  }
  if (config.wsUrl) {
    WS_BASE = config.wsUrl;
  }
};

export const api = {
  createRoom: async (ttlMinutes: number) => {
    const response = await apiClient.post('/api/v1/room/create', { ttlminutes: ttlMinutes });
    return response.data;
  },
  joinRoom: async (roomId: string) => {
    const response = await apiClient.post('/api/v1/room/join', { roomId });
    return response.data;
  },
  getRoom: async (roomId: string) => {
    const response = await apiClient.get(`/api/v1/room?roomId=${encodeURIComponent(roomId)}`);
    return response.data;
  },
  destroyRoom: async (roomId: string) => {
    const response = await apiClient.delete('/api/v1/room', { data: { roomId } });
    return response.data;
  },
  getWebSocketUrl: (roomId?: string, token?: string) => {
    return WS_BASE;
  },
};

export const wsSignaling = {
  sendJoinRoom: (ws: WebSocket, roomId: string, token: string) => {
    const msg: SignalingMessage = {
      type: 'join_room',
      roomId,
      token,
    };
    ws.send(JSON.stringify(msg));
  },
  sendOffer: (ws: WebSocket, offer: RTCSessionDescriptionInit, to?: string) => {
    const msg: SignalingMessage = {
      type: 'offer',
      offer,
      to: to || '',
    };
    ws.send(JSON.stringify(msg));
  },
  sendAnswer: (ws: WebSocket, answer: RTCSessionDescriptionInit, to?: string) => {
    const msg: SignalingMessage = {
      type: 'answer',
      answer,
      to: to || '',
    };
    ws.send(JSON.stringify(msg));
  },
  sendIceCandidate: (ws: WebSocket, candidate: RTCIceCandidateInit, to?: string) => {
    const msg: SignalingMessage = {
      type: 'ice-candidate',
      candidate,
      to: to || '',
    };
    ws.send(JSON.stringify(msg));
  },
  sendPeerDisconnect: (ws: WebSocket, roomId: string, token: string) => {
    const msg: SignalingMessage = {
      type: 'peer-disconnect',
      roomId,
      token,
    };
    ws.send(JSON.stringify(msg));
  },
};
