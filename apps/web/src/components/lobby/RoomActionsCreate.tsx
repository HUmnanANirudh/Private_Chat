import { useState } from "react";
import type { RoomActionsCreateProps } from "@repo/types";

export default function RoomActionsCreate({
  oncreateRoom,
  setMode,
}: RoomActionsCreateProps) {
  const [roomTTL, setRoomTTL] = useState<number | "">(10);

  const validateTTL =
    typeof roomTTL === "number" && roomTTL > 0 && roomTTL <= 1440;

  return (
    <div className="flex flex-col w-full justify-center">
      <input
        placeholder="Enter TTL in minutes"
        value={roomTTL}
        onChange={(e) => setRoomTTL(Number(e.target.value.trim()) || "")}
        className={`flex items-center justify-between rounded-lg border bg-zinc-950 my-4 px-4 py-4 text-zinc-100
   ${roomTTL === "" || validateTTL ? "border-zinc-700" : "border-red-500"}`}
      />
      {roomTTL !== "" && !validateTTL && (
        <p className="text-xs text-red-400 mb-4">
          TTL must be between 1 and 1440 minutes
        </p>
      )}
      <div className="flex justify-center items-center w-full gap-4">
        <button
          disabled={!validateTTL}
          onClick={() => oncreateRoom(Number(roomTTL))}
          className="p-4 bg-zinc-100 text-zinc-900 font-bold hover:bg-zinc-200 hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-300 active:scale-75 text-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          CREATE ROOM
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
