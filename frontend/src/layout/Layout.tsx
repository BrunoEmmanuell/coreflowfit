import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-slate-800">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="md:pl-16"> {/* reserve space for collapsed sidebar minimal width */}
        <Header onMobileOpen={() => setMobileOpen(true)} />
        <main className="mx-auto px-4 py-6 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  )
}
