import { createLazyFileRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import Lobby from '../components/Lobby'
import { useMutation } from '@tanstack/react-query'
import { api } from '@repo/api-client'

export const Route = createLazyFileRoute('/')({
  component: Home,
})

function Home() {
  const navigate = useNavigate()
  const locationState: any = useRouterState({ select: (s) => s.location.state })
  const mode = locationState?.mode
  const room = locationState?.room

  const createRoomMutation = useMutation({
    mutationFn: (ttl: number) => api.createRoom(ttl),
    onSuccess: (data) => {
      console.log('Room created:', data)
      navigate({ to: '/room/$roomId', params: { roomId: data.roomId } })
    },
    onError: (err) => {
      console.error('Failed to create room:', err)
    },
  })

  const joinRoomMutation = useMutation({
    mutationFn: (roomId: string) => api.joinRoom(roomId),
    onSuccess: (data, roomId) => {
      console.log('Joined room:', data)
      navigate({ to: '/room/$roomId', params: { roomId } })
    },
    onError: (err: any) => {
      console.error('Failed to join room:', err)
      if (err?.response?.status === 404) {
        navigate({ to: '/error/room-not-found' })
      } else if (err?.response?.status === 403) {
        navigate({ to: '/error/room-full' })
      } else {
        navigate({ to: '/error' })
      }
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