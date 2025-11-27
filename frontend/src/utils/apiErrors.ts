// src/utils/apiErrors.ts
import type { AxiosError } from 'axios'

/**
 * Normaliza mensagens de erro vindas da API para apresentação ao usuário.
 * Tenta extrair os formatos mais comuns:
 * - { detail: 'mensagem' }
 * - { message: 'mensagem' }
 * - { errors: { field: ['msg1','msg2'] } } (FastAPI / Pydantic style or Laravel style)
 * - axios error.message
 */
export function getApiErrorMessage(err: unknown): string {
  // AxiosError guard
  const e = err as AxiosError | any
  if (!e) return 'Erro desconhecido'

  // 1) axios network error
  if (e.code === 'ECONNABORTED' || e.message === 'Network Error') {
    return 'Falha de rede. Verifique sua conexão.'
  }

  // 2) response data patterns
  const data = e?.response?.data
  if (data) {
    // FastAPI style { detail: '...' }
    if (typeof data.detail === 'string') return data.detail

    // generic message
    if (typeof data.message === 'string') return data.message

    // validation errors: { errors: { field: [ 'err1' ] } } or { field: ['err1'] }
    if (typeof data === 'object') {
      // check nested errors object
      const errorsObj = data.errors ?? data
      if (errorsObj && typeof errorsObj === 'object') {
        // take first field/message
        const firstKey = Object.keys(errorsObj)[0]
        const val = errorsObj[firstKey]
        if (Array.isArray(val) && val.length > 0) return String(val[0])
        if (typeof val === 'string') return val
      }
    }
  }

  // fallback: axios message or toString
  return (e?.response?.status && `Erro ${e.response.status}: ${e.response.statusText}`) || e?.message || String(err)
}
