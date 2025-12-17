"use client"
import { useParams } from "next/navigation"

export default function RoomPage() {
    const roomID = useParams().roomId;
    return(
        <main>
            {roomID}
        </main>
    )
}