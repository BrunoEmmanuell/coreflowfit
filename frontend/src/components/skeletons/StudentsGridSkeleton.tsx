import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export default function StudentsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-4 bg-white rounded-xl shadow-card flex flex-col gap-3">
          <Skeleton className="h-20 w-20 rounded-full mx-auto" />
          <Skeleton className="h-4 w-3/5 mx-auto" />
          <Skeleton className="h-4 w-2/5 mx-auto" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  )
}
