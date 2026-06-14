import { registry } from "../registry";

export const answerHandler = (roomId: string,Token: string, sdp:RTCSessionDescriptionInit) => {
    const room = registry.get(roomId);
    if (!room) {
        return;
    }

    for (const [token, peer] of room) {
        if (token !== Token) {
            peer.send(JSON.stringify({
                type: "answer",
                data: sdp,
                from: Token
            }));
        }
    }
}