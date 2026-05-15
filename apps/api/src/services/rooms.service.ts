// import { client, roomKey, roomMetaKey } from "../lib/redis";
// import type { Participant, RoomState, PollState } from "@repo/types";

// const MAX_PARTICIPANTS = 2;

// function generateRoomCode(): string {
//     return Math.random().toString(36).substring(2, 8).toUpperCase();
// }

// export async function createRoom(ttlMinutes: number): Promise<RoomState> {
//     let roomId = generateRoomCode();

//     let existing = await client.exists(roomKey(roomId));
//     while (existing) {
//         roomId = generateRoomCode();
//         existing = await client.exists(roomKey(roomId));
//     }

//     const now = Date.now();
//     const state: RoomState = {
//         id: roomId,
//         hostId: "",
//         maxParticipants: MAX_PARTICIPANTS,
//         participants: {},
//         createdAt: now,
//         expiresAt: now + ttlMinutes * 60 * 1000
//     };

//     await client.hset(roomKey(roomId), {
//         hostId: state.hostId,
//         maxParticipants: String(state.maxParticipants),
//         participants: JSON.stringify(state.participants),
//         createdAt: String(state.createdAt),
//         expiresAt: String(state.expiresAt),
//         activePoll: ""
//     });

//     await client.set(`${roomKey(roomId)}:ttl`, String(ttlMinutes * 60));
//     await client.expire(roomKey(roomId), ttlMinutes * 60);

//     return state;
// }

// export async function getRoomState(roomId: string): Promise<RoomState | null> {
//     const data = await client.hgetall(roomKey(roomId));
//     if (!data || Object.keys(data).length === 0) return null;

//     return {
//         id: roomId,
//         hostId: data.hostId || "",
//         maxParticipants: Number(data.maxParticipants) || MAX_PARTICIPANTS,
//         participants: JSON.parse(data.participants || "{}"),
//         createdAt: Number(data.createdAt) || Date.now(),
//         expiresAt: Number(data.expiresAt) || 0,
//         activePoll: data.activePoll ? JSON.parse(data.activePoll) : undefined
//     };
// }

// export async function saveRoomState(state: RoomState): Promise<void> {
//     const updates: Record<string, string> = {
//         hostId: state.hostId,
//         maxParticipants: String(state.maxParticipants),
//         participants: JSON.stringify(state.participants),
//         createdAt: String(state.createdAt),
//         expiresAt: String(state.expiresAt),
//     };

//     if (state.activePoll) {
//         updates.activePoll = JSON.stringify(state.activePoll);
//     } else {
//         updates.activePoll = "";
//     }

//     await client.hset(roomKey(state.id), updates);

//     const remainingTtl = Math.floor((state.expiresAt - Date.now()) / 1000);
//     if (remainingTtl > 0) {
//         await client.expire(roomKey(state.id), remainingTtl);
//     }
// }

// export async function getRoomMeta(roomId: string): Promise<Record<string, string>> {
//     return client.hgetall(roomMetaKey(roomId));
// }

// export async function updateRoomMeta(roomId: string, data: Record<string, string>): Promise<void> {
//     await client.hset(roomMetaKey(roomId), data);
// }

// export async function addParticipant(roomId: string, participant: Participant): Promise<RoomState | null> {
//     const state = await getRoomState(roomId);
//     if (!state) return null;

//     if (Object.keys(state.participants).length >= state.maxParticipants) {
//         return null;
//     }

//     if (!state.hostId) {
//         state.hostId = participant.id;
//         participant.isHost = true;
//     }

//     state.participants[participant.id] = participant;
//     await saveRoomState(state);

//     return state;
// }

// export async function removeParticipant(roomId: string, userId: string): Promise<RoomState | null> {
//     const state = await getRoomState(roomId);
//     if (!state) return null;

//     delete state.participants[userId];

//     if (state.hostId === userId) {
//         const remainingIds = Object.keys(state.participants);
//         state.hostId = remainingIds[0] || "";
//         if (state.hostId && state.participants[state.hostId]) {
//             state.participants[state.hostId].isHost = true;
//         }
//     }

//     if (Object.keys(state.participants).length === 0) {
//         await client.del(roomKey(roomId));
//         return null;
//     }

//     await saveRoomState(state);
//     return state;
// }

// export async function updatePoll(roomId: string, poll: PollState): Promise<RoomState | null> {
//     const state = await getRoomState(roomId);
//     if (!state) return null;

//     state.activePoll = poll;
//     await saveRoomState(state);
//     return state;
// }

// export async function extendRoom(roomId: string, additionalMinutes: number): Promise<RoomState | null> {
//     const state = await getRoomState(roomId);
//     if (!state) return null;

//     state.expiresAt += additionalMinutes * 60 * 1000;
//     await saveRoomState(state);
//     return state;
// }

// export async function destroyRoom(roomId: string): Promise<boolean> {
//     const deleted = await client.del(roomKey(roomId));
//     return deleted > 0;
// }