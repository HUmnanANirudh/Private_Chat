import IdentityCard from "./IdentityCard";
import type { LobbyProps } from "../interface";

export default function Lobby({
  roomId,
  onCreateRoom,
  onJoinRoom,
  JoiningMode,
}: LobbyProps) {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center">
      <div className="flex flex-col justify-center items-center mb-4">
        <h1 className="text-3xl font-semibold text-zinc-100 my-4">
          {">_"} Private_Chat
        </h1>
        <p className="text-sm text-zinc-400 text-center">
          A private self destructing chat application
        </p>
      </div>
      <div className="w-full max-w-lg px-4">
        <IdentityCard
          onCreateRoom={onCreateRoom || (() => {})}
          onJoinRoom={onJoinRoom || (() => {})}
          roomId={roomId || ""}
          JoiningMode={JoiningMode}
        />
      </div>
    </main>
  );
}
