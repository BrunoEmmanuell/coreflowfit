import React from 'react'
import Spinner from './Spinner'

export default function FullscreenLoader() {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <Spinner size={48} />
    </div>
  )
}
