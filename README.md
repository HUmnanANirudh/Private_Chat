# Private_Chat

A secure, self-destructing real-time chat application built with modern web technologies. Create temporary chat rooms that automatically destroy themselves after a set time limit, ensuring your conversations remain private and ephemeral.

## Features

- **Self-Destructing Rooms**: Chat rooms automatically expire after a configurable time limit (1-1440 minutes)
- **Real-time Messaging**: Instant message delivery using Upstash Realtime
- **Anonymous Identity**: Random username generation for each user
- **Room Sharing**: Easy room code sharing to invite participants
- **Manual Destruction**: Destroy chat rooms instantly at any time

## Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching

### Backend & API
- **[Elysia.js](https://elysiajs.com/)** - Fast and type-safe backend framework
- **[Eden Treaty](https://elysiajs.com/eden/overview.html)** - End-to-end type safety between client and server
- **[Zod](https://zod.dev/)** - Schema validation

### Database & Real-time
- **[Upstash Redis](https://upstash.com/)** - Serverless Redis for data storage
- **[Upstash Realtime](https://upstash.com/docs/realtime/overall/getstarted)** - Real-time message broadcasting

## Project Structure

```
realtime_chat/
├── app/
│   ├── api/                    # API routes
│   │   ├── [[...slugs]]/      # Catch-all API routes
│   │   │   ├── auth.ts        # Authentication middleware
│   │   │   └── route.ts       # Room and message endpoints
│   │   ├── realtime/          # Real-time SSE endpoint
│   │   └── schemas/           # API validation schemas
│   ├── components/            # React components
│   │   ├── ChatRoom.tsx       # Chat interface
│   │   ├── IdentityCard.tsx   # User identity display
│   │   ├── Lobby.tsx          # Landing page
│   │   └── RoomActions.tsx    # Room creation/joining
│   ├── interface/             # TypeScript interfaces
│   ├── lib/                   # Utility libraries
│   │   ├── client.ts          # Eden Treaty client
│   │   ├── realtime-client.ts # Real-time hooks
│   │   ├── realtime.ts        # Upstash Realtime instance
│   │   └── redis.ts           # Redis client
│   └── room/[roomId]/         # Dynamic room pages
├── Providers/                 # React providers
└── public/                    # Static assets
```

## How It Works

### Room Creation
1. User lands on the lobby page with an auto-generated anonymous username
2. User creates a room by setting a Time-To-Live (TTL) in minutes
3. Backend generates a unique 8-character room ID
4. Room metadata is stored in Redis with an expiration time
5. User is redirected to the chat room

### Messaging
1. Messages are sent via Elysia API endpoints
2. Messages are stored in Redis with room-specific keys
3. Upstash Realtime broadcasts message events to all connected clients
4. Clients receive real-time updates and refetch messages

### Room Destruction
- **Automatic**: Redis automatically deletes room data after TTL expires
- **Manual**: Users can trigger immediate room destruction
- Real-time events notify all participants when a room is destroyed

## Security

- No persistent user data storage
- Anonymous username generation
- Automatic room expiration
- Server-side validation with Zod schemas
- Type-safe API with Eden Treaty