"use client";
import { useState, useEffect } from "react";
import { RefreshCcw } from "lucide-react";
import RoomActions from "./RoomActions";

const Names = [
  "Aether",
  "Nyx",
  "Orion",
  "Loki",
  "Zephyr",
  "Atlas",
  "Fenrir",
  "Kairo",
  "Raven",
  "Onyx",
  "Valkyrie",
  "Draco",
  "Sable",
  "Echo",
  "Cosmo",
  "Artemis",
  "Wolfgang",
  "Storm",
  "Leon",
  "Nova",
  "Hades",
  "Kitsune",
  "Shadow",
  "Blaze",
  "Falcon",
  "Zorro",
  "Titan",
];

const usernameGenerator = () => {
  const name = Names[Math.floor(Math.random() * Names.length)];
  const id = crypto.randomUUID().slice(0, 6);
  return `${name}_${id}`;
};

import type { IdentityCardProps } from "../interface";

export default function IdentityCard({
  onCreateRoom,
  onJoinRoom,
  roomId, JoiningMode
}: IdentityCardProps) {
  const [userName, setuserName] = useState("");
  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored) {
      setuserName(stored);
    } else {
      const newUserName = usernameGenerator();
      localStorage.setItem("username", newUserName);
      setuserName(newUserName);
    }
  }, []);
  const regenerate = () => {
    localStorage.removeItem("username");
    const username = usernameGenerator();
    localStorage.setItem("username", username);
    setuserName(username);
  };
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-amber-50">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-1">
        Your Identity
      </h1>
      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-950 my-4 px-4 py-4">
        <span className="text-sm font-medium text-zinc-100">{userName}</span>
        <button
          onClick={regenerate}
          className="ml-4  py-1 bg-zinc-900 text-zinc-100 rounded-full hover:text-zinc-400 cursor-pointer"
        >
          <RefreshCcw />
        </button>
      </div>
      <RoomActions oncreateRoom={onCreateRoom} onjoinRoom={onJoinRoom} JoinMode={JoiningMode} room={roomId} />
    </div>
  );
}
