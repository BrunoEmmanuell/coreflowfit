import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Home, Users, BarChart, LogOut } from 'lucide-react'
import { useAuth as useAuthContext } from '@/contexts/AuthContext'

const SIDEBAR_KEY = 'cf_sidebar_collapsed'

export default function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })
  const { logout, user } = useAuthContext()

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    } catch {}
  }, [collapsed])

  // desktop width: when collapsed show icons only, else full width
  const widthClass = collapsed ? 'w-16' : 'w-64'

  // mobile: use a fixed drawer overlay controlled by mobileOpen/onMobileClose
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:fixed md:inset-y-0 md:flex md:flex-col md:overflow-y-auto bg-surface border-r border-slate-100 z-20 transition-width duration-200',
          widthClass
        )}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className={cn('flex items-center gap-3', collapsed ? 'justify-center' : '')}>
            <div className="text-primary font-bold">{!collapsed && 'CoreFlowFit'}</div>
            {/* small logo or icon could be here */}
          </div>

          <div>
            <Button variant="ghost" size="sm" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? 'Expandir menu' : 'Colapsar menu'}>
              {collapsed ? 'Â»' : 'Â«'}
            </Button>
          </div>
        </div>

        <nav className="flex-1 px-1 py-4 space-y-1">
          <NavItem to="/dashboard" label="Dashboard" icon={<Home className="w-5 h-5" />} collapsed={collapsed} />
          <NavItem to="/dashboard" label="Alunos" icon={<Users className="w-5 h-5" />} collapsed={collapsed} />
          <NavItem to="/evolucao" label="EvoluÃ§Ã£o" icon={<BarChart className="w-5 h-5" />} collapsed={collapsed} />
          {/* add more nav items */}
        </nav>

        <div className="px-3 py-3 border-t">
          <div className={cn('flex items-center gap-3', collapsed ? 'flex-col' : '')}>
            {!collapsed && (
              <div>
                <div className="text-sm font-medium">{(user as any)?.nome ?? 'â€”'}</div>
                <div className="text-xs text-slate-500">Personal Trainer</div>
              </div>
            )}
            <div className="ml-auto">
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                <LogOut className="w-4 h-4 mr-2 inline" /> {!collapsed && 'Sair'}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <div className={cn('md:hidden fixed inset-0 z-30', mobileOpen ? 'visible' : 'pointer-events-none invisible')}>
        <div
          className={cn('absolute inset-0 bg-black/40 transition-opacity', mobileOpen ? 'opacity-100' : 'opacity-0')}
          onClick={onMobileClose}
          aria-hidden
        />
        <aside className={cn('absolute left-0 top-0 bottom-0 w-72 bg-surface shadow-xl overflow-auto transform transition-transform', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="font-semibold">CoreFlowFit</div>
            <Button variant="ghost" size="sm" onClick={onMobileClose}>Fechar</Button>
          </div>

          <nav className="p-4 space-y-2">
            <NavLink onClick={onMobileClose} to="/dashboard" className={({isActive})=> cn('flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-50', isActive ? 'bg-slate-100' : '')}><Home className="w-5 h-5" /> Dashboard</NavLink>
            <NavLink onClick={onMobileClose} to="/alunos" className={({isActive})=> cn('flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-50', isActive ? 'bg-slate-100' : '')}><Users className="w-5 h-5" /> Alunos</NavLink>
            <NavLink onClick={onMobileClose} to="/evolucao" className={({isActive})=> cn('flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-50', isActive ? 'bg-slate-100' : '')}><BarChart className="w-5 h-5" /> EvoluÃ§Ã£o</NavLink>
            <div className="border-t mt-3 pt-3">
              <Button variant="ghost" size="sm" onClick={() => { onMobileClose(); logout(); }}>Sair</Button>
            </div>
          </nav>
        </aside>
      </div>
    </>
  )
}

function NavItem({ to, label, icon, collapsed }: { to: string; label: string; icon: React.ReactNode; collapsed?: boolean }) {
  return (
    <NavLink to={to} className={({ isActive }) => cn(
      'flex items-center gap-3 px-3 py-2 rounded-md mx-2 hover:bg-slate-50',
      isActive ? 'bg-slate-100 font-medium' : 'text-slate-700'
    )}>
      <div className="flex-shrink-0">{icon}</div>
      {!collapsed && <div className="truncate">{label}</div>}
    </NavLink>
  )
}

