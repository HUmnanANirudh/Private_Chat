export type UserIdentity = {
  id: string;
  name: string;
  token: string;
};

export type Participant = UserIdentity & {
  isHost: boolean;
  isAway: boolean;
  joinedAt: number;
};

export type PollType = 'DESTROY' | 'EXTEND';

export type PollState = {
  id: string;
  type: PollType;
  creatorId: string;
  votes: Record<string, 'YES' | 'NO'>; // userId -> vote
  expiresAt: number;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
};

export type RoomState = {
  id: string;
  hostId: string;
  maxParticipants: number;
  participants: Record<string, Participant>; // userId -> Participant
  createdAt: number;
  expiresAt: number;
  activePoll?: PollState;
};

export type SignalingMessage = 
  | { type: 'OFFER'; targetId: string; senderId: string; sdp: any }
  | { type: 'ANSWER'; targetId: string; senderId: string; sdp: any }
  | { type: 'ICE_CANDIDATE'; targetId: string; senderId: string; candidate: any }
  | { type: 'JOIN_ROOM'; roomId: string; identity: UserIdentity }
  | { type: 'LEAVE_ROOM'; roomId: string }
  | { type: 'START_POLL'; roomId: string; pollType: PollType }
  | { type: 'VOTE'; roomId: string; pollId: string; vote: 'YES' | 'NO' }
  | { type: 'CHAT_MESSAGE'; roomId: string; content: string; senderId: string }
  | { type: 'FILE_SHARE_NOTIFY'; roomId: string; fileName: string; senderId: string }
  | { type: 'FILE_DOWNLOADED_NOTIFY'; roomId: string; fileName: string; downloaderId: string; senderId: string };

export type ServerEvent = 
  | { type: 'ROOM_STATE_UPDATE'; state: RoomState }
  | { type: 'PARTICIPANT_JOINED'; participant: Participant }
  | { type: 'PARTICIPANT_LEFT'; userId: string }
  | { type: 'POLL_STARTED'; poll: PollState }
  | { type: 'POLL_RESULT'; result: 'EXECUTE' | 'STATUS_QUO'; poll: PollState }
  | { type: 'ERROR'; message: string }
  | { type: 'OFFER'; senderId: string; sdp: any }
  | { type: 'ANSWER'; senderId: string; sdp: any }
  | { type: 'ICE_CANDIDATE'; senderId: string; candidate: any }
  | { type: 'CHAT_MESSAGE'; content: string; senderId: string; timestamp: number }
  | { type: 'FILE_SHARE_NOTIFY'; fileName: string; senderId: string }
  | { type: 'FILE_DOWNLOADED_NOTIFY'; fileName: string; downloaderId: string };

// Props interfaces for UI components
export type JoiningMode = "create" | "join" | "idle";

export interface IdentityCardProps {
  onCreateRoom: (ttl: number) => void;
  onJoinRoom: (roomId: string) => void;
  roomId: string;
  JoiningMode?: JoiningMode;
}

export interface LobbyProps {
  roomId?: string;
  JoiningMode?: JoiningMode;
  onCreateRoom?: (ttl: number) => void;
  onJoinRoom?: (roomId: string) => void;
}

export interface RoomActionsProps {
  oncreateRoom: (ttl: number) => void;
  onjoinRoom: (roomId: string) => void;
  JoinMode?: JoiningMode;
  room: string;
}

export interface ChatRoomProps {
  roomId?: string;
}
