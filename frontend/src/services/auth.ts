// src/services/auth.ts
// Helpers simples para armazenar/recuperar token no localStorage
export const TOKEN_KEY = 'cf_token'

export const setToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch (e) {
    console.error('Erro ao salvar token', e)
  }
}

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch (e) {
    return null
  }
}

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch (e) {
    console.error('Erro ao remover token', e)
  }
}

/**
 * decodeJwt
 * Decodifica o payload de um JWT sem validação de assinatura.
 * Útil para checar claims locais como exp (expiração).
 */
export function decodeJwt(token: string | null) {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // atob may not be available in some environments; browser has it.
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    // pad with '='
    const pad = payload.length % 4
    const padded = pad ? payload + '='.repeat(4 - pad) : payload
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch (e) {
    console.warn('decodeJwt falhou:', e)
    return null
  }
}
