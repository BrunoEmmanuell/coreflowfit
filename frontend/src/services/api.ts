// src/services/api.ts
import axios from 'axios'
import { getToken, clearToken } from './auth'
import routerNavigate from './routerNavigate' // navegação safe fora de componentes

// ❗ Altere aqui para seu backend FastAPI no Render
const API_URL = import.meta.env.VITE_API_URL || 'https://seu-backend.onrender.com'

// instancia principal
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

/* -------------------------
   🔹 REQUEST INTERCEPTOR
-------------------------- */
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/* -------------------------
   🔹 RESPONSE INTERCEPTOR
   Trata erros como 401, 403, network...
-------------------------- */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status

    // 401 → Token expirado / inválido
    if (status === 401) {
      console.warn('🔒 Token expirado ou inválido, executando logout automático...')

      // Remove token do storage
      clearToken()

      // Redireciona para login mesmo fora de componentes
      routerNavigate('/login')

      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api
