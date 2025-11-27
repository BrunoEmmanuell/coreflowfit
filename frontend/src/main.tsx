// src/main.tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { AlunosProvider } from '@/contexts/AlunosContext'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AlunosProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AlunosProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
