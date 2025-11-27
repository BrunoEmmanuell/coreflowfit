// src/components/layout/Layout.tsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Users, Home, BarChart, LogOut } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'

/**
 * Layout minimal, self-contained:
 * - Sidebar (desktop) / Drawer (mobile)
 * - Header with mobile menu button
 * - Main content container
 *
 * Colar este arquivo em src/components/layout/Layout.tsx
 * (é autossuficiente; não depende de outros componentes customizados)
 */

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { logout, user } = useAuthContext()

  return (
    <div className="min-h-screen bg-background text-slate-800">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-surface border-r border-slate-100 z-20 transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="text-primary font-bold">{!collapsed && 'CoreFlowFit'}</div>
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expandir menu' : 'Colapsar menu'}
            className="text-sm px-2 py-1 rounded hover:bg-slate-50"
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          <NavItem to="/dashboard" label="Dashboard" icon={<Home className="w-5 h-5" />} collapsed={collapsed} />
          <NavItem to="/alunos" label="Alunos" icon={<Users className="w-5 h-5" />} collapsed={collapsed} />
          <NavItem to="/evolucao" label="Evolução" icon={<BarChart className="w-5 h-5" />} collapsed={collapsed} />
        </nav>

        <div className="px-3 py-3 border-t">
          <div className="flex items-center gap-3">
            {!collapsed && (
              <div>
                <div className="text-sm font-medium truncate">{user?.nome ?? '—'}</div>
                <div className="text-xs text-slate-500">Personal Trainer</div>
              </div>
            )}
            <div className="ml-auto">
              <button onClick={() => logout()} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50">
                <LogOut className="w-4 h-4" />
                {!collapsed && <span>Sair</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div className={`md:hidden fixed inset-0 z-30 ${mobileOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 bottom-0 w-72 bg-surface shadow-xl overflow-auto transform transition-transform ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="font-semibold">CoreFlowFit</div>
            <button className="px-2 py-1" onClick={() => setMobileOpen(false)}>Fechar</button>
          </div>

          <nav className="p-4 space-y-2">
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-50">
              <Home className="w-5 h-5" /> Dashboard
            </Link>
            <Link to="/alunos" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-50">
              <Users className="w-5 h-5" /> Alunos
            </Link>
            <Link to="/evolucao" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-50">
              <BarChart className="w-5 h-5" /> Evolução
            </Link>

            <div className="border-t mt-3 pt-3">
              <button className="w-full text-left px-3 py-2 rounded hover:bg-slate-50" onClick={() => { setMobileOpen(false); logout(); }}>
                <LogOut className="w-4 h-4 inline mr-2" /> Sair
              </button>
            </div>
          </nav>
        </aside>
      </div>

      {/* Page content */}
      <div className="md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background border-b border-slate-100">
          <div className="mx-auto px-4 py-3 max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="md:hidden">
                <button onClick={() => setMobileOpen(true)} aria-label="Abrir menu" className="p-2 rounded hover:bg-slate-50">
                  <Menu className="w-5 h-5" />
                </button>
              </div>

              <h1 className="text-lg font-semibold">CoreFlowFit</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* placeholder para avatar / notificações */}
              <div className="w-8 h-8 rounded-full bg-slate-200" />
            </div>
          </div>
        </header>

        <main className="mx-auto px-4 py-6 max-w-7xl">{children}</main>
      </div>
    </div>
  )
}

function NavItem({ to, label, icon, collapsed }: { to: string; label: string; icon: React.ReactNode; collapsed?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-3 py-2 rounded-md mx-2 hover:bg-slate-50">
      <div className="flex-shrink-0">{icon}</div>
      {!collapsed && <div className="truncate">{label}</div>}
    </Link>
  )
}
