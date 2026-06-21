import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../services/apiClient";

export function useRoomToken(roomId: string) {
  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/api/v1/room/join", { roomId });
      return res.data;
    },
  });

  const ensureToken = useCallback(async (): Promise<string | null> => {
    try {
      const data = await joinMutation.mutateAsync();
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
  }, [roomId, joinMutation]);

  return { ensureToken };
}
