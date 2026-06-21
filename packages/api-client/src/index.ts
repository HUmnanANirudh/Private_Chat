import axios from 'axios';
import type { SignalingMessage } from '@repo/types';

const isBrowser = typeof window !== 'undefined';

const getEnv = (key: string): string | undefined => {
  const g = (typeof globalThis !== 'undefined' ? globalThis : {}) as any;
  if (g.process?.env?.[key]) {
    return g.process.env[key];
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  return undefined;
};

const resolveUrl = (envValue: string | undefined, defaultPort: string, protocolDefault: string): string => {
  if (envValue) return envValue;
  if (isBrowser) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    if (protocolDefault === 'ws') {
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${hostname}:${defaultPort}`;
    }
    return `${protocol}//${hostname}:${defaultPort}`;
  }
  return `${protocolDefault}://localhost:${defaultPort}`;
};

export const API_BASE = resolveUrl(getEnv('API_URL'), '9000', 'http');
export const WS_BASE = resolveUrl(getEnv('APi_URL'), '9001', 'ws');

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const response = await apiClient.get(`/api/v1/room?roomId=${roomId}`);
    return response.data;
  },
  destroyRoom: async (roomId: string) => {
    const response = await apiClient.delete('/api/v1/room', { data: { roomId } });
    return response.data;
  },
  getWebSocketUrl: (roomId: string, token: string) => {
    return `${WS_BASE}?roomId=${roomId}&token=${token}`;
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
