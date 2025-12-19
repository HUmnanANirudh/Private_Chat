"use client";
import IdentityCard from "./components/IdentityCard";
import { useMutation } from "@tanstack/react-query";
import { client } from "./lib/client";
import RoomActions from "./components/RoomActions";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { mutate: createRoom } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post();
      return res;
    },
    onSuccess: (res) => {
      router.push(`/room/${res.data?.roomId}`);
    },
  });
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center">
      <div className="flex flex-col justify-center items-center mb-4">
        <h1 className="text-3xl font-semibold text-zinc-100 my-4">
          {">_"} Private_Chat
        </h1>
        <p className="text-sm text-zinc-400 text-center">
          A private self destructing chat application
        </p>
      </div>
      <div className="w-full max-w-lg px-4">
        <IdentityCard/>
      </div>
    </main>
  );
}
