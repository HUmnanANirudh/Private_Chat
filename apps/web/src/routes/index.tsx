import { createFileRoute, useNavigate } from '@tanstack/react-router'
import Lobby from '../components/Lobby'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const navigate = useNavigate()

  const handleCreateRoom = (ttl: number) => {
    console.log('Creating room with TTL:', ttl)
    // TODO: Implement API call
    // For now, let's just generate a random ID and navigate
    const roomId = Math.random().toString(36).substring(2, 10)
    navigate({ to: '/room/$roomId', params: { roomId } })
  }

  const handleJoinRoom = (roomId: string) => {
    navigate({ to: '/room/$roomId', params: { roomId } })
  }

  return (
    <Lobby
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      JoiningMode="idle"
    />
  )
}
