import type { UseDestroyRoomProps } from "@repo/types";

export function useDestroyRoom({
  roomId,
  chatManagerRef,
  handleRoomDestroyed,
}: UseDestroyRoomProps) {
  const callDestroyRoom = async () => {
    try {
      await fetch(`/api/v1/room`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
        credentials: "include",
      });
    } catch (err) {
      console.error("[Chat] Failed to destroy room via API:", err);
    }
  };

  const destroyRoom = async () => {
    chatManagerRef.current?.leaveRoom();
    await callDestroyRoom();
    handleRoomDestroyed();
  };

  return { destroyRoom };
}
