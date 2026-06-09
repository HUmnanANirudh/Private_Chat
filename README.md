# Private Chat (Self-Destructing WebRTC Chat)

## About

A secure, self-destructing real-time chat application. Create temporary chat rooms that automatically destroy themselves after a set time limit, ensuring your conversations remain private.

## How It Works (Architecture)

Built as a fast, scalable, and type-safe monorepo, this project uses WebRTC for peer-to-peer communication. Real-time peer-to-peer applications require incredibly low-latency signaling, robust connection state management, and clear separation of concerns. This architecture solves these challenges by:
- **Separation of Concerns**: Splitting HTTP room orchestration (Express) from WebRTC signaling (Bun WebSockets).
- **Sub-10ms Latency & Self-Destruction**: Utilizing Redis for an atomic, centralized state layer and robust TTL (Time-To-Live) expiration logic to automatically destroy rooms.
- **Type Safety**: Ensuring seamless and safe data structures across the full stack (Frontend, API, WebSocket, and Database) through shared TypeScript packages.
- **Performant Runtimes**: Leveraging the speed of the Bun runtime and Vite for rapid development and high throughput.

## What?

This project is a Bun workspace monorepo composed of the following apps and packages:

### Apps
- **`apps/api`**: An Express server handling HTTP REST requests, room creation, orchestration, validation, and authentication checks (runs on port `9000`).
- **`apps/ws`**: A native Bun WebSocket server specifically optimized for WebRTC signaling. Handles `offer`, `answer`, `ice-candidate`, `peer-disconnect`, and `join_room` events securely (runs on port `9001`).
- **`apps/web`**: The frontend UI built with React, Vite, Tailwind CSS v4, TanStack Router, and TanStack Query.

### Packages
- **`packages/redis`**: A shared module encapsulating Redis logic for consistent state synchronization (atomic JSON reads/writes, TTL logic) between the API and WebSocket server.
- **`packages/types`**: Centralized TypeScript definitions (`@repo/types`) used uniformly across the monorepo for maximum type-safety.

## How to Run

### Prerequisites
- [Bun](https://bun.sh/) (v1.3+ recommended)
- A running Redis instance

### 1. Installation
Clone the repository and install dependencies from the root directory:
```bash
bun install
```

### 2. Environment Setup
Create a `.env` file at the root of the project with your Redis connection string:
```env
REDIS_URL=redis://username:password@host:port
```

### 3. Development
Start all services (API, WebSocket Server, and Web Frontend) concurrently:
```bash
bun run dev
```

The apps will be available at:
- Web Frontend: `http://localhost:3000`
- API Server: `http://localhost:9000`
- WebSocket Server: `ws://localhost:9001`

*(Note: Individual scripts are also available if you need to run them separately, e.g., `bun run dev:api`, `bun run dev:ws`, `bun run dev:web`)*

### 4. Build
To build all applications for production:
```bash
bun run build
```
To start the built applications:
```bash
bun run start
```

---
*Powered by Bun – A fast all-in-one JavaScript runtime.*
