import type { RoomActionsJoinProps } from "@repo/types";
import { useState, useEffect } from "react";

export default function RoomActionsJoin({
  onjoinRoom,
  setMode,
  initialRoomCode = "",
}: RoomActionsJoinProps) {
  const [roomCode, setRoomCode] = useState(initialRoomCode);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
    }
  }, [initialRoomCode]);

  const validRoomCode = roomCode.trim().length >= 8;

  return (
    <div className="flex flex-col w-full justify-center">
      <input
        placeholder="Enter room code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value.trim())}
        className={`flex items-center justify-between rounded-lg border bg-zinc-950 my-4 px-4 py-4 text-zinc-100
    ${roomCode === "" || validRoomCode ? "border-zinc-700" : "border-red-500"}`}
      />
      {roomCode && !validRoomCode && (
        <p className="text-xs text-red-400 mb-4">Room code invalid (minimum 8 characters)</p>
      )}
      <div className="flex justify-center items-center w-full gap-4">
        <button
          disabled={!validRoomCode}
          onClick={() => onjoinRoom(roomCode)}
          className="p-4 bg-zinc-100 text-zinc-900 font-bold hover:bg-zinc-200 hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-300 active:scale-75 text-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          JOIN CHAT ROOM
        </button>
        <button
          onClick={() => setMode("idle")}
          className="p-4 bg-zinc-100 text-zinc-900 font-bold hover:bg-zinc-200 hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-300 active:scale-75 text-sm"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
