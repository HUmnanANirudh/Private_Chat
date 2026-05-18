import { registry } from "../registry";

export const offerHandler = (roomId: string, senderToken: string, sdp:RTCSessionDescriptionInit) => {
    const room = registry.get(roomId);

    if (!room) {
        return;
    }
    
    for (const [token, peer] of room) {
        if (token !== senderToken) {
            peer.send(JSON.stringify({
                type: "offer",
                roomId,
                sdp
            }));
        }
    }
}