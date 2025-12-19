"use client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Lobby from "./components/Lobby";
import { client } from "./lib/client";
import type { JoiningMode } from "./interface";

export default function HomeClient() {
  const router = useRouter();
  const { mutate: createRoom } = useMutation({
    mutationFn: async (ROOM_TTL_SECONDS: number) => {
      const res = await client.room.create.post({ ROOM_TTL_SECONDS });
      return res;
    },
    onSuccess: (res) => {
      localStorage.setItem("Created","true");
      router.push(`/room/${res.data?.roomId}`);
    },
  });

  const handleCreateRoom = (ttl: number) => {
    if (ttl <= 0 || ttl > 1440) return;
    const seconds = ttl * 60;
    createRoom(seconds);
  }
  const handleJoinRoom = (roomId: string) => {
    router.push(`/room/${roomId}`);
  }
  
  const joiningMode: JoiningMode = "idle";
  
  return (
    <Lobby
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      JoiningMode={joiningMode}
    />
  );
}
