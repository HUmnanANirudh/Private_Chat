import { createLazyFileRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import Lobby from '../components/Lobby'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'

export const Route = createLazyFileRoute('/')({
  component: Home,
})

function Home() {
  const navigate = useNavigate()
  const locationState: any = useRouterState({ select: (s) => s.location.state })
  const mode = locationState?.mode
  const room = locationState?.room

  const createRoomMutation = useMutation({
    mutationFn: async (ttl: number) => {
      const response = await apiClient.post('/api/v1/room/create', { ttlminutes: ttl })
      return response.data
    },
    onSuccess: (data) => {
      console.log('Room created:', data)
      navigate({ to: '/room/$roomId', params: { roomId: data.roomId } })
    },
    onError: (err) => {
      console.error('Failed to create room:', err)
    },
  })

  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const response = await apiClient.post('/api/v1/room/join', { roomId })
      return response.data
    },
    onSuccess: (data, roomId) => {
      console.log('Joined room:', data)
      navigate({ to: '/room/$roomId', params: { roomId } })
    },
    onError: (err) => {
      console.error('Failed to join room:', err)
    },
  })

  return (
    <Lobby
      roomId={room}
      onCreateRoom={(ttl) => createRoomMutation.mutate(ttl)}
      onJoinRoom={(roomId) => joinRoomMutation.mutate(roomId)}
      JoiningMode={mode || 'idle'}
    />
  )
}