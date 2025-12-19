import OverlayModal from "@/app/components/OverlayModal";

export default function RoomNotFound() {
  return (
    <>
      <OverlayModal
        title="Room not found"
        description="The chat room you are looking for does not exist."
        redirectTo="/"
        seconds={10}
      />
    </>
  );
}