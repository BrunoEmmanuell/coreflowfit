import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import { setToken, clearToken } from '@/services/auth'

type LoginPayload = { email: string; senha: string }

export const useLogin = () =>
  useMutation(async (payload: LoginPayload) => {
    const res = await api.post('/api/v1/instrutores/login', payload)
    const token = res.data?.access_token ?? res.data?.token
    if (!token) throw new Error('Token não retornado')
    setToken(token)
    return token
  })

export const logout = () => {
  clearToken()
  // opcional: limpar cache react-query
}
