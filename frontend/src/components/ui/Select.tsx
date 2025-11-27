import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'

export type Option = {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectProps {
  options: Option[]
  value?: Option | null
  onChange?: (opt: Option | null) => void
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  clearable?: boolean
  className?: string
  name?: string
}

export default function Select({
  options,
  value = null,
  onChange,
  placeholder = 'Selecione...',
  disabled = false,
  searchable = true,
  clearable = true,
  className,
  name,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    if (open) setHighlight(0)
  }, [open, query])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  useEffect(() => {
    if (open && searchable) inputRef.current?.focus()
  }, [open, searchable])

  function selectOption(opt: Option) {
    if (opt.disabled) return
    onChange?.(opt)
    setOpen(false)
    setQuery('')
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((p) => Math.min(p + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((p) => Math.max(p - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filtered[highlight]
      if (opt) selectOption(opt)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative inline-block w-full', className)}>
      <div
        className={cn(
          'flex items-center gap-2 w-full bg-white border rounded-md px-3 py-2 cursor-pointer',
          disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-400',
          'select-none'
        )}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setOpen((o) => !o)
        }}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex-1 truncate text-sm text-slate-700">
          {value ? value.label : <span className="text-slate-400">{placeholder}</span>}
        </div>

        {clearable && value && (
          <button
            type="button"
            className="p-1 rounded hover:bg-slate-100"
            onClick={(e) => {
              e.stopPropagation()
              onChange?.(null)
            }}
            aria-label="Limpar seleção"
          >
            {/* X icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="ml-1">
          <svg xmlns="http://www.w3.org/2000/svg" className={cn('w-4 h-4 transform', open ? 'rotate-180' : '')} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Hidden input for forms */}
      {name && <input type="hidden" name={name} value={value?.value ?? ''} />}

      {/* Dropdown */}
      <div
        role="listbox"
        aria-activedescendant={open ? `select-opt-${highlight}` : undefined}
        className={cn(
          'absolute left-0 right-0 mt-2 z-50 bg-white border rounded-md shadow-lg overflow-hidden transition-opacity duration-150',
          open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        )}
      >
        <div className="p-2">
          {searchable && (
            <div className="mb-2">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                className="w-full px-3 py-2 rounded-md border text-sm"
                placeholder="Pesquisar..."
              />
            </div>
          )}

          <div className="max-h-48 overflow-auto">
            {filtered.length === 0 && <div className="p-2 text-sm text-slate-500">Nenhuma opção</div>}
            {filtered.map((opt, idx) => (
              <div
                id={`select-opt-${idx}`}
                role="option"
                aria-selected={value?.value === opt.value}
                key={String(opt.value)}
                className={cn(
                  'px-3 py-2 text-sm cursor-pointer flex items-center justify-between',
                  opt.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100',
                  idx === highlight ? 'bg-slate-100' : ''
                )}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => selectOption(opt)}
              >
                <div className={cn('truncate')}>{opt.label}</div>
                {value?.value === opt.value && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
