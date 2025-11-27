// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import { getToken, setToken, clearToken, decodeJwt } from '@/services/auth'
import { useQueryClient } from '@tanstack/react-query'

type User = {
  id?: string
  nome?: string
  email?: string
  [k: string]: any
}

type AuthContextValue = {
  user: User | null
  setUser: (u: User | null) => void
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (payload: { email: string; senha: string }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(getToken())
  const [loading, setLoading] = useState<boolean>(true)
  const qc = useQueryClient()
  const navigate = useNavigate()

  // inicial: tenta recuperar token e user (se existir endpoint /me)
  useEffect(() => {
    async function init() {
      const t = getToken()
      setTokenState(t)
      if (!t) {
        setUser(null)
        setLoading(false)
        return
      }

      // opcional: checar exp localmente
      const payload = decodeJwt(t)
      if (payload?.exp && Date.now() > payload.exp * 1000) {
        // token expirado
        clearToken()
        setTokenState(null)
        setUser(null)
        setLoading(false)
        return
      }

      // tentar buscar info do usuário (ajuste rota se necessário)
      try {
        const { data } = await api.get('/api/v1/instrutores/me') // ajuste se não existir
        setUser(data)
      } catch (e) {
        // se não tiver /me, podemos decodificar token (se contiver dados) ou deixar null
        // fallback: deixar user null
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (payload: { email: string; senha: string }) => {
    setLoading(true)
    try {
      const res = await api.post('/api/v1/instrutores/login', payload)
      const t = res.data?.access_token ?? res.data?.token
      if (!t) throw new Error('Token não retornado')
      setToken(t) // salva em localStorage
      setTokenState(t)
      // opcional: set user if backend returns profile on login
      if (res.data?.user) setUser(res.data.user)
      else {
        // tentar carregar /me
        try {
          const { data } = await api.get('/api/v1/instrutores/me')
          setUser(data)
        } catch {
          setUser(null)
        }
      }
      setLoading(false)
      // invalidate queries that depend on auth
      qc.invalidateQueries()
      // redirecionamento deve ser tratado pelo componente chamador (ex: navigate('/dashboard'))
    } catch (err) {
      setLoading(false)
      throw err
    }
  }

  const logout = () => {
    clearToken()
    setTokenState(null)
    setUser(null)
    // limpar cache react-query
    try {
      qc.clear()
    } catch (e) {
      // ignore
    }
    navigate('/login', { replace: true })
  }

  const refreshUser = async () => {
    if (!getToken()) return setUser(null)
    try {
      const { data } = await api.get('/api/v1/instrutores/me')
      setUser(data)
    } catch {
      setUser(null)
    }
  }

  const value: AuthContextValue = {
    user,
    setUser,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
