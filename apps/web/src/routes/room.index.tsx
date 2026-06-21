import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/room/')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      invite: search.invite as string | undefined,
    }
  },
  component: RoomIndexPage,
})

function RoomIndexPage() {
  const { invite } = Route.useSearch()
  const navigate = useNavigate()

  useEffect(() => {
    navigate({
      to: '/',
      state: { mode: 'join', room: invite || '' } as any
    })
  }, [invite, navigate])

  return null
}
