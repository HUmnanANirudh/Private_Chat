"use client";
import { useState } from "react";
import type { RoomActionsProps, JoiningMode } from "../interface";

export default function RoomActions({ oncreateRoom, onjoinRoom, JoinMode, room}: RoomActionsProps) {
  const [mode, setMode] = useState<JoiningMode>(JoinMode || "idle");
  const [roomTTL, setRoomTTL] = useState<number | "">(10);
  const [roomCode, setRoomCode] = useState(room || "");

  const validateTTL =
    typeof roomTTL === "number" && roomTTL > 0 && roomTTL <= 1440;
  const validRoomCode =
    roomCode.trim().length === 8 && /^[a-zA-Z0-9]+$/.test(roomCode);
  return (
    <div className="flex justify-center items-center w-full gap-4 ransition-all duration-300 ease-in-out">
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
            onChange={(e) => setRoomTTL(Number(e.target.value.trim()) || "")}
            className={`flex items-center justify-between rounded-lg border bg-zinc-950 my-4 px-4 py-4
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
              className="p-4 bg-zinc-100 text-background font-bold hover:bg-zinc-200 hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-300 active:scale-75 text-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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
            onChange={(e) => setRoomCode(e.target.value.trim())}
            className={`flex items-center justify-between rounded-lg bg-zinc-950 my-4 px-4 py-4
    ${roomCode !== "" || validRoomCode ? "border-zinc-700" : "border-red-500"}`}
          />
          {roomCode && !validRoomCode && (
            <p className="text-xs text-red-400 mb-4">Room code invalid</p>
          )}
          <div className="flex justify-center items-center w-full gap-4">
            <button
              disabled={!validRoomCode}
              onClick={() => onjoinRoom(roomCode)}
              className="p-4 bg-zinc-100 text-background font-bold hover:bg-zinc-200 hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-300 active:scale-75 text-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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
