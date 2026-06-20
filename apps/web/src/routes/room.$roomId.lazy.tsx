import { createLazyFileRoute } from '@tanstack/react-router'
import Chat from '../components/ChatRoom'

export const Route = createLazyFileRoute('/room/$roomId')({
  component: RoomPage,
})

function RoomPage() {
  const { roomId } = Route.useParams()

  return <Chat roomId={roomId} />
}
