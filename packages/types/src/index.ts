import { roomValidation, type ChatRoomProps, type LobbyProps, type RoomActionsProps, type JoiningMode, type IdentityCardProps, type ChatManagerState, type TextMessage, type FileMessage } from "./rooms";

export const validation = {
    ...roomValidation
}

export type { ChatRoomProps, LobbyProps, RoomActionsProps, JoiningMode, IdentityCardProps, ChatManagerState, TextMessage, FileMessage };