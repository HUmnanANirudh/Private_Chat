"use client";
import { useState } from "react";
type mode = "create" | "join" | "idle";
export default function RoomActions() {
  const [mode, setMode] = useState<mode>("idle");
  const [roomTTL, setRoomTTL] = useState<number | "">("");
  const [roomCode, setRoomCode] = useState("");
  const createRoom = () => {
    console.log("Creating room with TTL:", roomTTL);
  };
  const joinRoom = () => {
    console.log("Joining room with code:", roomCode);
  };
  return (
    <div
      className="flex justify-center items-center w-full gap-4 ransition-all duration-300 ease-in-out"
    >
      {mode === "idle" && (
        <>
          <button
            onClick={() => {
              setMode("create");
            }}
            className="p-4 bg-zinc-100 text-background font-bold hover:bg-zinc-200 hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-300 active:scale-75 text-sm"
          >
            CREATE NEW CHAT ROOM
          </button>
          <button
            onClick={() => setMode("join")}
            className="p-4 bg-zinc-100 text-background font-bold hover:bg-zinc-200 hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-300 active:scale-75 text-sm"
          >
            JOIN A CHAT ROOM
          </button>
        </>
      )}
      {mode === "create" && (
        <div className="flex flex-col w-full justify-center">
          <input
            placeholder="Enter TTL in minutes"
            value={roomTTL}
            onChange={(e) => setRoomTTL(Number(e.target.value))}
            className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-950 my-4 px-4 py-4"
          />
          <div className="flex justify-center items-center w-full gap-4">
            <button
              onClick={() => createRoom()}
              className="p-4 bg-zinc-100 text-background font-bold hover:bg-zinc-200 hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-300 active:scale-75 text-sm"
            >
              CREATE ROOM
            </button>
            <button
              onClick={() => setMode("idle")}
              className="p-4 bg-zinc-100 text-background font-bold hover:bg-zinc-200 hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-300 active:scale-75 text-sm"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
      {mode === "join" && (
        <div className="flex flex-col w-full justify-center">
          <input
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-950 my-4 px-4 py-4"
          />
          <div className="flex justify-center items-center w-full gap-4">
            <button
              onClick={() => joinRoom()}
              className="p-4 bg-zinc-100 text-background font-bold hover:bg-zinc-200 hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-300 active:scale-75 text-sm"
            >
              JOIN CHAT ROOM
            </button>
            <button
              onClick={() => setMode("idle")}
              className="p-4 bg-zinc-100 text-background font-bold hover:bg-zinc-200 hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-300 active:scale-75 text-sm"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
