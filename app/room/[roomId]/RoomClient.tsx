"use client";
import Chat from "@/app/components/ChatRoom";
import Lobby from "@/app/components/Lobby";
import { useParams } from "next/navigation";
import { useState } from "react";

type mode = "lobby" | "chat";
export default function RoomClient() {
  const [mode, setMode] = useState<mode>("lobby");
  const params = useParams();
  const roomId = String(params.roomId);
  return (
    <>
      {mode === "lobby" && (
        <Lobby
          roomId={roomId}
          onJoinRoom={() => setMode("chat")}
          JoiningMode={"join"}
        />
      )}
      {mode === "chat" && <Chat roomId={roomId} />}
    </>
  );
}
