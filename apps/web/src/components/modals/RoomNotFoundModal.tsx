import ChatBackgroundMock from "../chat/ChatBackgroundMock";
import OverlayModal from "./OverlayModal";

export default function RoomNotFoundModal() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-950">
      <ChatBackgroundMock />
      <OverlayModal
        title="Room Not Found"
        description="The chat room link you followed is invalid, or the room has expired and been destroyed."
        redirectTo="/"
        seconds={10}
      />
    </div>
  );
}
