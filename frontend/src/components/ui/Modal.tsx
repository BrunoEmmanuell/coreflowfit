import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

type Size = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  size?: Size
  closeOnBackdrop?: boolean
  ariaLabel?: string
}

const SIZE_MAP: Record<Size, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [] as HTMLElement[]
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]'
    )
  ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1')
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  ariaLabel,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const lastActiveRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      lastActiveRef.current = document.activeElement as HTMLElement | null
      setTimeout(() => {
        panelRef.current?.focus()
      }, 0)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      lastActiveRef.current?.focus()
    }
  }, [open])

  // close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        // Simple focus trap
        const focusable = getFocusableElements(panelRef.current)
        if (focusable.length === 0) {
          e.preventDefault()
          return
        }
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!panelRef.current) return
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      aria-hidden={!open}
      ref={overlayRef}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        open ? 'visible' : 'pointer-events-none invisible'
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 backdrop-blur-sm bg-black/40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onMouseDown={(e) => {
          if (!closeOnBackdrop) return
          if (e.target === overlayRef.current) onClose()
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        ref={panelRef}
        className={cn(
          'relative w-full mx-4 transition-transform duration-300 transform',
          open ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95',
          SIZE_MAP[size]
        )}
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          {(title || onClose) && (
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="text-lg font-medium text-slate-800">{title}</div>
              <div>
                <button
                  aria-label="Fechar"
                  className="p-2 rounded-md hover:bg-slate-100"
                  onClick={onClose}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-5 text-slate-700 max-h-[70vh] overflow-auto">{children}</div>

          {/* Footer */}
          {footer && <div className="px-6 py-4 border-t bg-slate-50">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body
  )
}
