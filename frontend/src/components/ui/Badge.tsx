import React from 'react'
import { cn } from '@/utils/cn'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  className?: string
}

const VARIANT_MAP = {
  success: 'bg-green-100 text-green-700 border border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  danger: 'bg-rose-100 text-rose-700 border border-rose-300',
  info: 'bg-sky-100 text-sky-700 border border-sky-300',
  neutral: 'bg-slate-100 text-slate-700 border border-slate-300',
}

export default function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full select-none',
        VARIANT_MAP[variant],
        className
      )}
    >
      {children}
    </span>
  )
}