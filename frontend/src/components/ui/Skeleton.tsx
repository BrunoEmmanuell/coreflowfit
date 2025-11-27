// src/components/ui/Skeleton.tsx
import React from 'react'
import { cn } from '@/utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-700/40',
        className
      )}
    />
  )
}
