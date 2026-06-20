import type { RoomActionsIdleProps } from "@repo/types";

export default function RoomActionsIdle({ setMode }: RoomActionsIdleProps) {
  return (
    <>
      <button
        onClick={() => setMode("create")}
        className="p-4 bg-zinc-100 text-zinc-900 font-bold hover:bg-zinc-200 hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-300 active:scale-75 text-sm"
      >
        CREATE NEW CHAT ROOM
      </button>
      <button
        onClick={() => setMode("join")}
        className="p-4 bg-zinc-100 text-zinc-900 font-bold hover:bg-zinc-200 hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-300 active:scale-75 text-sm"
      >
        JOIN A CHAT ROOM
      </button>
    </>
  );
}
