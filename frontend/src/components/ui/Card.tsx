import React from 'react'
import { cn } from '@/utils/cn'

export interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined'
  className?: string
  children: React.ReactNode
}

export interface CardSectionProps {
  className?: string
  children: React.ReactNode
}

const variantMap = {
  default: 'bg-white border border-slate-200',
  elevated: 'bg-white shadow-md',
  outlined: 'bg-white border-2 border-slate-300',
}

export function Card({ variant = 'default', className, children }: CardProps) {
  return (
    <div className={cn('rounded-xl overflow-hidden', variantMap[variant], className)}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: CardSectionProps) {
  return (
    <div className={cn('px-5 py-4 border-b border-slate-200 font-medium text-slate-800', className)}>
      {children}
    </div>
  )
}

export function CardBody({ className, children }: CardSectionProps) {
  return <div className={cn('px-5 py-4 text-slate-700', className)}>{children}</div>
}

export function CardFooter({ className, children }: CardSectionProps) {
  return (
    <div className={cn('px-5 py-4 border-t border-slate-200 text-sm text-slate-600', className)}>
      {children}
    </div>
  )
}

export default Card
