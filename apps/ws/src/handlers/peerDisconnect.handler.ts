import { registry } from "../registry";

export const peerDisconnectHandler = (roomId: string, token: string) => {
    const room = registry.get(roomId);

    if (!room) return;

    room.delete(token);

    for (const [, peer] of room) {
            peer.send(JSON.stringify({
                type: "peer-disconnect",
            }));
    }
    if (room.size === 0) {
        registry.delete(roomId);
    }
}