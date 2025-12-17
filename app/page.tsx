"use client"
import { useEffect, useState } from "react";
import { RefreshCcw } from 'lucide-react';
import { useMutation } from "@tanstack/react-query";
import { client } from "./lib/client";
import { useRouter } from "next/navigation";
const Names  = [
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
  "Titan"
];

const usernameGenrator =  () =>{
  const name = Names[Math.floor(Math.random() * Names.length)];
  const id = crypto.randomUUID().slice(0,6);
  return `${name}_${id}`
}

export default function Home() {
  const router = useRouter();
  const [userName,setuserName]  =  useState('');
  useEffect(() => {
    const stored = localStorage.getItem("username");
    if(stored) {
      setuserName(stored);
    } else {
      const newUserName = usernameGenrator();
      localStorage.setItem("username", newUserName);
      setuserName(newUserName);
    }
  }, []);
const regenerate = ()=>{
  localStorage.removeItem("username");
  const username = usernameGenrator();
  localStorage.setItem("username",username);
  setuserName(username);
}
const {mutate:createRoom}= useMutation({
  mutationFn:async () => {
    const res = await client.room.create.post();
    return res
  },
  onSuccess: (res) => {
    router.push(`/room/${res.data?.roomId}`);
  }
})
  return (
  <main className="min-h-screen w-full flex items-center justify-center bg-zinc-950 px-4 pt-12">
  <div className="w-full max-w-md -translate-y-24 md:-translate-y-16">
     <div className="flex flex-col justify-center items-center mb-4">
    <h1 className="text-3xl font-semibold text-zinc-100 my-4">{">_"} Private_Chat</h1>
    <p className="text-sm text-zinc-400 text-center">A private self destructing chat application</p>
    </div>
    <div className="rounded-md border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-amber-50">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-1">
        Your Identity
      </h1>
      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-950 my-4 px-4 py-4">
        <span className="text-sm font-medium text-zinc-100">
          {userName}
        </span>
        <button onClick={regenerate} className="ml-4  py-1 bg-zinc-900 text-zinc-100 rounded-full hover:text-zinc-400 cursor-pointer">
          <RefreshCcw />
        </button>
      </div>
      <div className="flex justify-center items-center w-full">
        <button onClick={()=>createRoom()} className="p-4 bg-zinc-100 text-background font-bold hover:bg-zinc-200 hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-300 active:scale-75 text-sm">
          CREATE NEW CHAT ROOM
        </button>
      </div>
    </div>
  </div>
</main>

  );
}
