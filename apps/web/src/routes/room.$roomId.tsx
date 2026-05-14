import { createFileRoute } from '@tanstack/react-router'
import Chat from '../components/ChatRoom'

export const Route = createFileRoute('/room/$roomId')({
  component: RoomPage,
})

function RoomPage() {
  const { roomId } = Route.useParams()

  return <Chat roomId={roomId} />
}
