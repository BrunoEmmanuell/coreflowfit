// src/components/PrivateRoute.tsx
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getToken } from '@/services/auth'

/**
 * PrivateRoute
 * - Verifica se existe token JWT (localStorage)
 * - Se não existir, redireciona para /login guardando a location atual em state
 *
 * Usage:
 * <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
 */

export default function PrivateRoute({ children }: { children: JSX.Element }) {
  const location = useLocation()
  const token = getToken()

  if (!token) {
    // não autenticado -> redireciona para /login e grava a origem em state
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // token presente -> renderiza o conteúdo protegido
  return children
}
