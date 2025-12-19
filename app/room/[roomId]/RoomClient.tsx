"use client";
import Chat from "@/app/components/ChatRoom";
import Lobby from "@/app/components/Lobby";
import { useState } from "react";

type Mode = "lobby" | "chat";
export default function RoomClient({ Mode,RoomId }: { Mode: Mode, RoomId: string }) {
  const [mode, setMode] = useState<Mode>(Mode);
  return (
    <>
      {mode === "lobby" && (
        <Lobby
          roomId={RoomId}
          onJoinRoom={() => setMode("chat")}
          JoiningMode={"join"}
        />
      )}
      {mode === "chat" && <Chat roomId={RoomId} />}
    </>
  );
}
