"use client";
import Chat from "@/app/components/ChatRoom";
import Lobby from "@/app/components/Lobby";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { JoiningMode } from "@/app/interface";

type mode = "lobby" | "chat";
export default function RoomPage() {
  const [mode, setMode] = useState<mode>("lobby");
  const params = useParams();
  const roomId = String(params.roomId);
  
  const joiningMode: JoiningMode = "join";
  
  return (
    <>
      {mode === "lobby" && (
        <Lobby
          roomId={roomId}
          onJoinRoom={() => setMode("chat")}
          JoiningMode={joiningMode}
        />
      )}
      {mode === "chat" && <Chat roomId={roomId}/>}
    </>
  );
}
