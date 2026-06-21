import type { UseDestroyRoomProps } from "@repo/types";
import { useMutation } from "@tanstack/react-query";
import { api } from "@repo/api-client";

export function useDestroyRoom({
  roomId,
  chatManagerRef,
  handleRoomDestroyed,
}: UseDestroyRoomProps) {
  const destroyMutation = useMutation({
    mutationFn: () => api.destroyRoom(roomId),
  });

  const destroyRoom = async () => {
    chatManagerRef.current?.leaveRoom();
    try {
      await destroyMutation.mutateAsync();
    } catch (err) {
      console.error("[Chat] Failed to destroy room via API:", err);
    }
    handleRoomDestroyed();
  };

  return { destroyRoom };
}
