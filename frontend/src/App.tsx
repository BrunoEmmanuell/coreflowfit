// src/App.tsx
import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { setNavigate as setRouterNavigate } from '@/services/routerNavigate'

// Pages
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import AlunoProfile from '@/pages/AlunoProfile'
import TreinoDetail from '@/pages/TreinoDetail'
import TreinosHistory from '@/pages/TreinosHistory'
import Evolucao from '@/pages/Evolucao'

// Components / utils
import PrivateRoute from '@/components/PrivateRoute'

export default function App(): JSX.Element {
  const navigate = useNavigate()

  // Allow non-React modules (axios interceptors) to navigate
  useEffect(() => {
    setRouterNavigate((path: string) => {
      // use navigate from react-router
      navigate(path)
    })
  }, [navigate])

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/alunos/:id"
        element={
          <PrivateRoute>
            <AlunoProfile />
          </PrivateRoute>
        }
      />

      <Route
        path="/aluno/:id/treinos"
        element={
          <PrivateRoute>
            <TreinosHistory />
          </PrivateRoute>
        }
      />

      <Route
        path="/aluno/:id/evolucao"
        element={
          <PrivateRoute>
            <Evolucao />
          </PrivateRoute>
        }
      />

      <Route
        path="/treino/:id"
        element={
          <PrivateRoute>
            <TreinoDetail />
          </PrivateRoute>
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
