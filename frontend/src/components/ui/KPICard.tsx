import React from 'react'

export default function KPICard({ title, value, subtitle }: { title: string; value: any; subtitle?: string }) {
  return (
    <div className="p-4 bg-white rounded shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-2">{subtitle}</div>}
    </div>
  )
}
