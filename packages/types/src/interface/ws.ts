interface offerMessage {
    type: "offer";
    roomId: string;
    sdp: RTCSessionDescriptionInit;
}

interface answerMessage {
    type: "answer";
    roomId: string;
    sdp: RTCSessionDescriptionInit;
}

interface iceCandidateMessage {
    type: "ice-candidate";
    roomId: string;
    candidate: RTCIceCandidateInit;
}

interface peerJoinedMessage {
    type: "peer-joined";
}

interface peerDisconnectedMessage {
    type: "peer-disconnected";
}

export type WSMessage =
    | offerMessage
    | answerMessage
    | iceCandidateMessage
    | peerJoinedMessage
    | peerDisconnectedMessage;

export interface wsData {
    roomId: string;
    token: string;
}