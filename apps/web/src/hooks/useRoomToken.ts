import { useCallback } from "react";
import { api } from "@repo/api-client";

export function useRoomToken(roomId: string) {
  const ensureToken = useCallback(async (): Promise<string | null> => {
    try {
      const data = await api.joinRoom(roomId);
      if (data.token) {
        return data.token;
      }
    } catch (e: any) {
      console.error("[Chat] Failed to join via API", e);
      if (e.response?.status === 403) {
        throw new Error("Room is full");
      }
      throw e;
    }
    return null;
  }, [roomId]);

  return { ensureToken };
}
