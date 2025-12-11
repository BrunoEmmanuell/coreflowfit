import React from 'react'
import { Button } from '@/components/ui/Button'
import { Menu } from 'lucide-react'

export default function Header({ onMobileOpen }: { onMobileOpen: () => void }) {
  return (
    <header className="sticky top-0 z-10 bg-background border-b border-slate-100">
      <div className="mx-auto px-4 md:pl-72 lg:pl-64"> {/* padding-left to offset sidebar widths on desktop */}
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={onMobileOpen} aria-label="Abrir menu">
                <Menu className="w-5 h-5" />
              </Button>
            </div>
            <div className="text-lg font-semibold">Dashboard</div>
          </div>

          <div className="flex items-center gap-3">
            {/* place for notifications/avatar/settings */}
          </div>
        </div>
      </div>
    </header>
  )
}
