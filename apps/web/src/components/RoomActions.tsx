import  { useState } from "react";
import type { RoomActionsProps, JoiningMode } from "@repo/types";
import RoomActionsIdle from "./lobby/RoomActionsIdle";
import RoomActionsCreate from "./lobby/RoomActionsCreate";
import RoomActionsJoin from "./lobby/RoomActionsJoin";

export default function RoomActions({
  oncreateRoom,
  onjoinRoom,
  JoinMode,
  room,
}: RoomActionsProps) {
  const [mode, setMode] = useState<JoiningMode>(JoinMode || "idle");

  const setModeHandler = (newMode: "idle" | "create" | "join") => {
    setMode(newMode);
  };

  return (
    <div className="flex justify-center items-center w-full gap-4 transition-all duration-300 ease-in-out">
      {mode === "idle" && (
        <RoomActionsIdle setMode={setModeHandler} />
      )}
      {mode === "create" && (
        <RoomActionsCreate
          oncreateRoom={oncreateRoom}
          setMode={() => setModeHandler("idle")}
        />
      )}
      {mode === "join" && (
        <RoomActionsJoin
          onjoinRoom={onjoinRoom}
          setMode={() => setModeHandler("idle")}
          initialRoomCode={room}
        />
      )}
    </div>
  );
}
