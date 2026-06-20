export type SignalingMessage =
  | { type: "join_room"; roomId: string; token: string }
  | { type: "offer"; offer: RTCSessionDescriptionInit; to: string }
  | { type: "answer"; answer: RTCSessionDescriptionInit; to: string }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit; to: string }
  | { type: "peer-disconnect"; roomId: string; token: string };

export type IncomingSignalingMessage =
  | { type: "ready"; initiator?: boolean }
  | { type: "offer"; data: RTCSessionDescriptionInit; from: string }
  | { type: "answer"; data: RTCSessionDescriptionInit; from: string }
  | { type: "ice-candidate"; data: RTCIceCandidateInit; from: string }
  | { type: "peer-disconnect"; from: string }
  | { type: "error"; message: string };

export interface wsData {
  roomId: string;
  token: string;
}