// src/utils/formErrors.ts
import type { SubmitErrorHandler } from 'react-hook-form'
import type { AxiosError } from 'axios'

/**
 * Tenta mapear erros de validação do backend para setError do react-hook-form.
 * Suporta:
 * - { errors: { field: ['msg'] } }
 * - { field: ['msg'] }
 * - FastAPI 422 detail -> [{ loc: ['body','field'], msg: '...', type: 'value_error' }]
 */
export function mapApiErrorsToForm<T>(err: unknown, setError: (name: keyof T, info: any) => void) {
  const e = err as AxiosError | any
  const data = e?.response?.data
  if (!data) return false

  // FastAPI 422 style
  if (Array.isArray(data?.detail)) {
    // detail: [{ loc: ['body','field'], msg: 'x' }]
    for (const item of data.detail) {
      const loc = Array.isArray(item.loc) ? item.loc : []
      const name = loc.length ? loc[loc.length - 1] : null
      if (name) setError(name, { type: 'server', message: item.msg })
    }
    return true
  }

  // generic errors object
  const errorsObj = data.errors ?? data
  if (errorsObj && typeof errorsObj === 'object') {
    for (const key of Object.keys(errorsObj)) {
      const val = errorsObj[key]
      if (Array.isArray(val) && val.length > 0) setError(key as keyof T, { type: 'server', message: String(val[0]) })
      else if (typeof val === 'string') setError(key as keyof T, { type: 'server', message: val })
    }
    return true
  }

  return false
}
