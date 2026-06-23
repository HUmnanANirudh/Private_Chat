import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { configureApiClient } from '@repo/api-client'
import { getRouter } from './router'
import './styles.css'

configureApiClient({
  apiUrl: import.meta.env.VITE_API_URL || (typeof process !== 'undefined' && process.env?.API_URL) || 'http://localhost:9000',
  wsUrl: import.meta.env.VITE_WS_URL || (typeof process !== 'undefined' && process.env?.WS_URL) || 'ws://localhost:9001',
});

const router = getRouter()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
