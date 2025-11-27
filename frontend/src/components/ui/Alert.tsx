import React, { useState } from 'react'
import { cn } from '@/utils/cn'

export interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  description?: string | React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

const TYPE_MAP = {
  success: 'bg-green-50 border-green-300 text-green-800',
  error: 'bg-rose-50 border-rose-300 text-rose-800',
  warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
  info: 'bg-sky-50 border-sky-300 text-sky-800',
}

const ICONS = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
    </svg>
  ),
}

export default function Alert({
  type = 'info',
  title,
  description,
  dismissible = false,
  onDismiss,
  className,
}: AlertProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  const handleClose = () => {
    setVisible(false)
    onDismiss?.()
  }

  return (
    <div
      className={cn(
        'w-full border rounded-xl p-4 flex items-start gap-3',
        TYPE_MAP[type],
        className
      )}
      role="alert"
    >
      <div className="pt-0.5">{ICONS[type]}</div>

      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        {description && <div className="text-sm leading-relaxed">{description}</div>}
      </div>

      {dismissible && (
        <button
          aria-label="Fechar alerta"
          className="p-1 rounded hover:bg-white/40"
          onClick={handleClose}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}