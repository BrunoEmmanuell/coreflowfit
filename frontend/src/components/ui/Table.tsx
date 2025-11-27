import React, { useMemo, useState } from 'react'
import { cn } from '@/utils/cn'

export type Column<T> = {
  key: string
  header: React.ReactNode
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
}

export interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: React.ReactNode
  onRowClick?: (row: T) => void
  className?: string
}

function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  return (
    <span className="inline-flex flex-col items-center justify-center ml-2">
      <svg className={cn('w-3 h-3', direction === 'asc' ? 'text-indigo-600' : 'text-slate-300')} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M5 11l5-5 5 5H5z" />
      </svg>
      <svg className={cn('w-3 h-3 -mt-1', direction === 'desc' ? 'text-indigo-600' : 'text-slate-300')} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M5 9l5 5 5-5H5z" />
      </svg>
    </span>
  )
}

export default function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado',
  onRowClick,
  className,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null)

  const onHeaderClick = (col: Column<T>) => {
    if (!col.sortable) return
    if (sortKey !== col.key) {
      setSortKey(col.key)
      setSortDir('asc')
    } else {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc')
      if (sortDir === 'desc') setSortKey(null)
    }
  }

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data
    const col = columns.find((c) => c.key === sortKey)
    if (!col) return data
    const copy = [...data]
    copy.sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (va == null && vb == null) return 0
      if (va == null) return sortDir === 'asc' ? -1 : 1
      if (vb == null) return sortDir === 'asc' ? 1 : -1
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb), undefined, { numeric: true })
        : String(vb).localeCompare(String(va), undefined, { numeric: true })
    })
    return copy
  }, [data, sortKey, sortDir, columns])

  return (
    <div className={cn('w-full overflow-x-auto bg-white rounded-lg shadow-sm', className)}>
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  'px-4 py-3 text-left text-sm font-medium text-slate-600 select-none',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.sortable ? 'cursor-pointer' : ''
                )}
                onClick={() => onHeaderClick(col)}
                aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center">
                  <span>{col.header}</span>
                  {col.sortable && <SortIcon direction={sortKey === col.key ? sortDir : null} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="text-sm text-slate-500">Carregando...</div>
                </div>
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, idx) => (
              <tr
                key={idx}
                className={cn('hover:bg-slate-50 transition-colors', onRowClick ? 'cursor-pointer' : '')}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-sm text-slate-700 align-top',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
