// import { client } from "../lib/redis";
// import type { Participant, RoomState, PollState, SignalingMessage, ServerEvent } from "@repo/types";

// const randomNames = [
//     "Anonymous Fox", "Silent Wolf", "Hidden Hawk", "Quiet Bear", "Secret Owl",
//     "Mystery Raven", "Shadow Lynx", "Silent Crane", "Hidden Serpent", "Quiet Panther",
//     "Stealth Falcon", "Phantom Fox", "Ghost Badger", "Covert Cobra", "Veiled Viper",
//     "Masked Mink", "Cloaked Crow", "Obscure Octopus", "Enigma Eagle", "Riddle Rhino"
// ];

// function generateName(): string {
//     const name = randomNames[Math.floor(Math.random() * randomNames.length)];
//     const number = Math.floor(Math.random() * 1000);
//     return `${name} #${number}`;
// }

// const connectedUsers = new Map<string, {
//     userId: string;
//     roomId: string | null;
//     identity: { id: string; name: string; token: string };
// }>();

// type WSData = {
//     userId: string;
//     roomId: string | null;
//     identity: { id: string; name: string; token: string };
// };

// async function getRoomState(roomId: string): Promise<RoomState | null> {
//     const data = await client.hgetall(roomKey(roomId));
//     if (!data || Object.keys(data).length === 0) return null;

//     return {
//         id: roomId,
//         hostId: data.hostId || "",
//         maxParticipants: Number(data.maxParticipants) || 2,
//         participants: JSON.parse(data.participants || "{}"),
//         createdAt: Number(data.createdAt) || Date.now(),
//         expiresAt: Number(data.expiresAt) || 0,
//         activePoll: data.activePoll ? JSON.parse(data.activePoll) : undefined
//     };
// }

// async function saveRoomState(state: RoomState): Promise<void> {
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

// function broadcastToRoom(roomId: string, event: ServerEvent, excludeId?: string): void {
//     for (const [wsId, user] of connectedUsers) {
//         if (user.roomId === roomId && wsId !== excludeId) {
//             // @ts-ignore - Bun's publish expects specific types
//             globalThis.ws?.publish?.(wsId, JSON.stringify(event));
//         }
//     }
// }

// function sendToUser(ws: ServerWebSocket<WSData>, event: ServerEvent): void {
//     ws.send(JSON.stringify(event));
// }

// async function handleJoinRoom(ws: ServerWebSocket<WSData>, roomId: string, identity?: { id: string; name: string; token: string }): Promise<void> {
//     const state = await getRoomState(roomId);

//     if (!state) {
//         sendToUser(ws, { type: "ERROR", message: "Room not found" });
//         return;
//     }

//     if (Date.now() > state.expiresAt) {
//         await client.del(roomKey(roomId));
//         sendToUser(ws, { type: "ERROR", message: "Room has expired" });
//         return;
//     }

//     const participantCount = Object.keys(state.participants).length;
//     const isReconnecting = identity && state.participants[identity.id];

//     if (participantCount >= state.maxParticipants && !isReconnecting) {
//         sendToUser(ws, { type: "ERROR", message: "Room is full" });
//         return;
//     }

//     const userId = identity?.id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
//     const userName = identity?.name || generateName();
//     const token = identity?.token || Math.random().toString(36).slice(0, 32);

//     const participant: Participant = {
//         id: userId,
//         name: userName,
//         token,
//         isHost: state.hostId === userId || Object.keys(state.participants).length === 0,
//         isAway: false,
//         joinedAt: Date.now()
//     };

//     state.participants[userId] = participant;
//     await saveRoomState(state);

//     ws.data = {
//         userId,
//         roomId,
//         identity: { id: userId, name: userName, token }
//     };

//     connectedUsers.set(ws.id, ws.data);

//     sendToUser(ws, {
//         type: "ROOM_STATE_UPDATE",
//         state: { ...state, activePoll: undefined }
//     });

//     broadcastToRoom(roomId, {
//         type: "PARTICIPANT_JOINED",
//         participant
//     }, ws.id);
// }

// async function handleLeaveRoom(ws: ServerWebSocket<WSData>): Promise<void> {
//     const { userId, roomId } = ws.data;

//     if (!roomId) return;

//     const state = await getRoomState(roomId);
//     if (state) {
//         if (state.participants[userId]) {
//             delete state.participants[userId];
//         }

//         if (Object.keys(state.participants).length === 0) {
//             await client.del(roomKey(roomId));
//         } else {
//             if (state.activePoll) {
//                 state.activePoll.status = "EXPIRED";
//             }
//             await saveRoomState(state);
//         }
//     }

//     broadcastToRoom(roomId, { type: "PARTICIPANT_LEFT", userId }, ws.id);
// }

// async function handleSignalingForward(ws: ServerWebSocket<WSData>, message: { type: string; targetId: string; senderId: string; sdp?: any; candidate?: any }): Promise<void> {
//     const { roomId } = ws.data;
//     if (!roomId) {
//         sendToUser(ws, { type: "ERROR", message: "Not in a room" });
//         return;
//     }

//     const eventType = message.type as "OFFER" | "ANSWER" | "ICE_CANDIDATE";

//     for (const [peerId, peer] of connectedUsers) {
//         if (peer.roomId === roomId && peer.userId === message.targetId) {
//             // Find the actual WebSocket and send directly
//             // This is a simplified approach - in production you'd track WS references
//             const event: ServerEvent = {
//                 type: eventType,
//                 senderId: message.senderId,
//                 ...(message.sdp && { sdp: message.sdp }),
//                 ...(message.candidate && { candidate: message.candidate })
//             } as any;
//             // For now, broadcast to all in room (including sender, client will filter)
//             broadcastToRoom(roomId, event, ws.id);
//             return;
//         }
//     }

//     sendToUser(ws, { type: "ERROR", message: "Target participant not found" });
// }

// async function handleChatMessage(ws: ServerWebSocket<WSData>, message: { roomId: string; content: string; senderId: string }): Promise<void> {
//     const { roomId } = ws.data;
//     if (!roomId || roomId !== message.roomId) {
//         sendToUser(ws, { type: "ERROR", message: "Not in this room" });
//         return;
//     }

//     broadcastToRoom(roomId, {
//         type: "CHAT_MESSAGE",
//         content: message.content,
//         senderId: message.senderId,
//         timestamp: Date.now()
//     }, ws.id);
// }

// async function handleStartPoll(ws: ServerWebSocket<WSData>, message: { roomId: string; pollType: "DESTROY" | "EXTEND" }): Promise<void> {
//     const { roomId } = ws.data;
//     if (!roomId || roomId !== message.roomId) {
//         sendToUser(ws, { type: "ERROR", message: "Not in this room" });
//         return;
//     }

//     const state = await getRoomState(message.roomId);
//     if (!state) {
//         sendToUser(ws, { type: "ERROR", message: "Room not found" });
//         return;
//     }

//     if (state.activePoll && state.activePoll.status === "ACTIVE") {
//         sendToUser(ws, { type: "ERROR", message: "A poll is already active" });
//         return;
//     }

//     const poll: PollState = {
//         id: `poll_${Date.now()}`,
//         type: message.pollType,
//         creatorId: ws.data.userId,
//         votes: {},
//         expiresAt: Date.now() + 60000,
//         status: "ACTIVE"
//     };

//     state.activePoll = poll;
//     await saveRoomState(state);

//     broadcastToRoom(message.roomId, { type: "POLL_STARTED", poll }, ws.id);
// }

// async function handleVote(ws: ServerWebSocket<WSData>, message: { roomId: string; pollId: string; vote: "YES" | "NO" }): Promise<void> {
//     const { roomId, userId } = ws.data;
//     if (!roomId || roomId !== message.roomId) {
//         sendToUser(ws, { type: "ERROR", message: "Not in this room" });
//         return;
//     }

//     const state = await getRoomState(message.roomId);
//     if (!state || !state.activePoll) {
//         sendToUser(ws, { type: "ERROR", message: "No active poll" });
//         return;
//     }

//     if (state.activePoll.id !== message.pollId) {
//         sendToUser(ws, { type: "ERROR", message: "Poll not found" });
//         return;
//     }

//     if (state.activePoll.votes[userId]) {
//         sendToUser(ws, { type: "ERROR", message: "Already voted" });
//         return;
//     }

//     state.activePoll.votes[userId] = message.vote;
//     await saveRoomState(state);

//     const participantIds = Object.keys(state.participants);
//     const allVoted = participantIds.every(id => state.activePoll!.votes[id]);

//     if (allVoted) {
//         const yesVotes = Object.values(state.activePoll.votes).filter(v => v === "YES").length;
//         const result = yesVotes === participantIds.length ? "EXECUTE" : "STATUS_QUO";

//         state.activePoll.status = "COMPLETED";

//         if (result === "EXECUTE" && state.activePoll.type === "DESTROY") {
//             await client.del(roomKey(message.roomId));
//         } else if (result === "EXECUTE" && state.activePoll.type === "EXTEND") {
//             state.expiresAt += 300000;
//         }

//         await saveRoomState(state);

//         broadcastToRoom(message.roomId, { type: "POLL_RESULT", result, poll: state.activePoll }, ws.id);
//     }
// }

// async function handleFileShareNotify(ws: ServerWebSocket<WSData>, message: { roomId: string; fileName: string; senderId: string }): Promise<void> {
//     const { roomId } = ws.data;
//     if (!roomId || roomId !== message.roomId) {
//         sendToUser(ws, { type: "ERROR", message: "Not in this room" });
//         return;
//     }

//     broadcastToRoom(message.roomId, {
//         type: "FILE_SHARE_NOTIFY",
//         fileName: message.fileName,
//         senderId: message.senderId
//     }, ws.id);
// }

// async function handleFileDownloadedNotify(ws: ServerWebSocket<WSData>, message: { roomId: string; fileName: string; downloaderId: string; senderId: string }): Promise<void> {
//     const { roomId } = ws.data;
//     if (!roomId || roomId !== message.roomId) {
//         sendToUser(ws, { type: "ERROR", message: "Not in this room" });
//         return;
//     }

//     broadcastToRoom(message.roomId, {
//         type: "FILE_DOWNLOADED_NOTIFY",
//         fileName: message.fileName,
//         downloaderId: message.downloaderId
//     }, ws.id);
// }

// async function handleMessage(ws: ServerWebSocket<WSData>, message: string | ArrayBuffer | Uint8Array): Promise<void> {
//     try {
//         const data = message instanceof Uint8Array
//             ? new TextDecoder().decode(message)
//             : typeof message === "string"
//                 ? message
//                 : new TextDecoder().decode(message);

//         const msg: SignalingMessage = JSON.parse(data);

//         switch (msg.type) {
//             case "JOIN_ROOM":
//                 await handleJoinRoom(ws, msg.roomId, msg.identity);
//                 break;

//             case "LEAVE_ROOM":
//                 await handleLeaveRoom(ws);
//                 break;

//             case "OFFER":
//             case "ANSWER":
//             case "ICE_CANDIDATE":
//                 await handleSignalingForward(ws, msg);
//                 break;

//             case "CHAT_MESSAGE":
//                 await handleChatMessage(ws, msg);
//                 break;

//             case "START_POLL":
//                 await handleStartPoll(ws, msg);
//                 break;

//             case "VOTE":
//                 await handleVote(ws, msg);
//                 break;

//             case "FILE_SHARE_NOTIFY":
//                 await handleFileShareNotify(ws, msg);
//                 break;

//             case "FILE_DOWNLOADED_NOTIFY":
//                 await handleFileDownloadedNotify(ws, msg);
//                 break;

//             default:
//                 sendToUser(ws, { type: "ERROR", message: "Unknown message type" });
//         }
//     } catch (err) {
//         console.error("Error handling WebSocket message:", err);
//         sendToUser(ws, { type: "ERROR", message: "Invalid message format" });
//     }
// }

// const WS_PORT = Number(process.env.WS_PORT) || 9001;

// const server = Bun.serve<WSData>({
//     fetch(req, server) {
//         const url = new URL(req.url);

//         if (url.pathname === "/ws") {
//             const cookieHeader = req.headers.get("cookie") || "";
//             const cookies = Object.fromEntries(
//                 cookieHeader.split(";").map(c => {
//                     const [k, ...v] = c.trim().split("=");
//                     return [k, v.join("=")];
//                 })
//             );

//             const existingToken = cookies["x-auth-value"];

//             server.upgrade(req, {
//                 data: {
//                     userId: "",
//                     roomId: null,
//                     identity: { id: "", name: "", token: existingToken || "" }
//                 }
//             });
//             return;
//         }

//         return new Response("Not found", { status: 404 });
//     },

//     websocket: {
//         message(ws, message) {
//             handleMessage(ws, message);
//         },

//         open(ws) {
//             console.log("WebSocket connected:", ws.id);
//         },

//         close(ws, code, reason) {
//             console.log("WebSocket disconnected:", ws.id, code, reason);
//             if (ws.data.roomId) {
//                 handleLeaveRoom(ws);
//             }
//             connectedUsers.delete(ws.id);
//         },

//         error(ws, error) {
//             console.error("WebSocket error:", error);
//         },
//     },

//     port: WS_PORT,
// });

// console.log(`WebSocket server running on port ${WS_PORT}`);