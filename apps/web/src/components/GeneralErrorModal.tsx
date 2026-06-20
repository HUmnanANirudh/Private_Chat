import type { GeneralErrorModalProps } from "@repo/types";
import ChatBackgroundMock from "./ChatBackgroundMock";
import OverlayModal from "./OverlayModal";

export default function GeneralErrorModal({ message = "Something went wrong." }: GeneralErrorModalProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-950">
      <ChatBackgroundMock />
      <OverlayModal
        title="An Error Occurred"
        description={message}
        redirectTo="/"
        seconds={10}
      />
    </div>
  );
}
