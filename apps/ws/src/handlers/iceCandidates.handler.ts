import { registry } from "../registry";

export const iceCandidatesHandler = (roomId: string, senderToken: string, candidate: RTCIceCandidateInit) => {
    const room = registry.get(roomId);

    if (!room) return;

    for (const [token, peer] of room) {
        if (token !== senderToken) {
            peer.send(JSON.stringify({
                type: "ice-candidate",
                data: candidate,
                from: senderToken
            }));
        }
    }
}