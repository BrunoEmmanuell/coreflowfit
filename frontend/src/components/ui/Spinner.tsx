// src/components/ui/Spinner.tsx
import React from 'react'

export default function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-4 border-slate-300 border-t-primary animate-spin"
      style={{ width: size, height: size }}
    />
  )
}
