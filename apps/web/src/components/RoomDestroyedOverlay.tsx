import type { RoomDestroyedOverlayProps } from "@repo/types";
import OverlayModal from "./OverlayModal";

export default function RoomDestroyedOverlay({ isOpen }: RoomDestroyedOverlayProps) {
  if (!isOpen) return null;

  return (
    <OverlayModal
      title="Room Destroyed"
      description="This room no longer exists. Redirecting to home..."
      redirectTo="/"
      seconds={5}
    />
  );
}
