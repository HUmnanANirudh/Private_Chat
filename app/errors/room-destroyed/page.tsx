import OverlayModal from "@/app/components/OverlayModal";

export default function RoomDestroyedPage() {
  return (
    <>
      <OverlayModal
        title="Room Destroyed"
        description="This chat room has been destroyed.All messages have been deleted."
        redirectTo="/"
        seconds={10}
      />
    </>
  );
}
