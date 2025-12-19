import OverlayModal from "@/app/components/OverlayModal";

export default function RoomFullPage() {
  return (
    <>
      <OverlayModal
        title="Room is full"
        description="This chat already has two participants."
        redirectTo="/"
        seconds={10}
      />
    </>
  );
}
