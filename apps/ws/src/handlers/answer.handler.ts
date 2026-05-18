import { registry } from "../registry";

export const answerHandler = (roomId: string, senderToken: string, sdp:RTCSessionDescriptionInit) => {
    const room = registry.get(roomId);

    if (!room) {
        return;
    }
    
    for (const [token, peer] of room) {
        if (token !== senderToken) {
            peer.send(JSON.stringify({
                type: "answer",
                roomId,
                sdp
            }));
        }
    }
}