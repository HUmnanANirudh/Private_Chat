import { createLazyFileRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import Lobby from '../components/Lobby'

export const Route = createLazyFileRoute('/')({
  component: Home,
})

function Home() {
  const navigate = useNavigate()
  const locationState: any = useRouterState({ select: (s) => s.location.state })
  const mode = locationState?.mode
  const room = locationState?.room

  const handleCreateRoom = async (ttl: number) => {
    console.log('Creating room with TTL:', ttl)
    try {
      const response = await fetch('/api/v1/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttlminutes: ttl }),
        credentials: 'include',
      })
      const data = await response.json()
      console.log('Room created:', data)
      navigate({ to: '/room/$roomId', params: { roomId: data.roomId } })
    } catch (err) {
      console.error('Failed to create room:', err)
    }
  }

  const handleJoinRoom = async (roomId: string) => {
    console.log('Joining room:', roomId)
    try {
      const response = await fetch(`/api/v1/room/join?roomId=${roomId}`, {
        credentials: 'include',
      })
      const data = await response.json()
      console.log('Joined room:', data)
      navigate({ to: '/room/$roomId', params: { roomId } })
    } catch (err) {
      console.error('Failed to join room:', err)
    }
  }

  return (
    <Lobby
      roomId={room}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      JoiningMode={mode || 'idle'}
    />
  )
}