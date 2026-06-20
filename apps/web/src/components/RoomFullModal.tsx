import ChatBackgroundMock from "./ChatBackgroundMock";
import OverlayModal from "./OverlayModal";

export default function RoomFullModal() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-950">
      <ChatBackgroundMock />
      <OverlayModal
        title="Room is Full"
        description="This private chat room has reached its maximum capacity. You cannot join this room at the moment."
        redirectTo="/"
        seconds={10}
      />
    </div>
  );
}
