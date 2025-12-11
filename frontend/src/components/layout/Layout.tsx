import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Users, Home, BarChart, LogOut, Calendar, Settings, DollarSign, Dumbbell } from 'lucide-react'
import { useAuth as useAuthContext } from '@/contexts/AuthContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { logout, user } = useAuthContext()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar Escura (Dark Mode) */}
      <aside
        className={`hidden md:flex flex-col fixed inset-y-0 z-20 transition-all duration-300 bg-[#0F172A] text-white ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            {/* Ícone da Marca (Pequeno) */}
            <svg className="w-8 h-8 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 6C17.8807 6 19 4.88071 19 3.5C19 2.11929 17.8807 1 16.5 1C15.1193 1 14 2.11929 14 3.5C14 4.88071 15.1193 6 16.5 6Z" />
              <path d="M12.5 7.5C10.85 7.5 9.6 7.9 8.6 8.5L3.5 11.2L4.8 13.6L8.5 11.6V17.5L5 22.5L7.5 24L11.5 18.5L14 21V24H16.5V19.5L13.5 16.5V11.5L16.5 14.5L18.8 12.8C18.8 12.8 17.5 8.5 16.5 8C15.5 7.5 13.5 7.5 12.5 7.5Z" />
            </svg>
            {!collapsed && <span className="font-bold text-xl tracking-tight">CoreFlowFit</span>}
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className={`px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${collapsed ? 'hidden' : 'block'}`}>Menu Principal</p>
          
          <NavItem to="/" label="Dashboard" icon={<Home size={20} />} collapsed={collapsed} active={location.pathname === '/'} />
          <NavItem to="/alunos" label="Meus Alunos" icon={<Users size={20} />} collapsed={collapsed} active={location.pathname.startsWith('/aluno')} />
          <NavItem to="/treinos" label="Treinos" icon={<Dumbbell size={20} />} collapsed={collapsed} />
          
          <div className={`my-4 border-t border-slate-800 ${collapsed ? 'hidden' : 'block'}`}></div>
          <p className={`px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${collapsed ? 'hidden' : 'block'}`}>Gestão</p>
          
          <NavItem to="/calendario" label="Calendário" icon={<Calendar size={20} />} collapsed={collapsed} />
          <NavItem to="/financeiro" label="Financeiro" icon={<DollarSign size={20} />} collapsed={collapsed} />
          <NavItem to="/configuracoes" label="Configurações" icon={<Settings size={20} />} collapsed={collapsed} />
        </nav>

        {/* Footer da Sidebar (User Profile) */}
        <div className="p-4 border-t border-slate-800 bg-[#0F172A]">
          <div className={`flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-slate-800/50 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-900/20">
              {(user as any)?.nome?.charAt(0) ?? 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate text-white">{(user as any)?.nome ?? 'Personal Trainer'}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => logout()} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                    <LogOut size={12} /> Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity" onClick={() => setMobileOpen(false)} />}
      
      {/* Mobile Drawer (Simplificado) */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-[#0F172A] z-40 transform transition-transform duration-300 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <span className="font-bold text-xl text-white">CoreFlowFit</span>
         </div>
         <nav className="p-4 space-y-2">
            <NavItem to="/" label="Dashboard" icon={<Home size={20} />} onClick={() => setMobileOpen(false)} />
            <NavItem to="/alunos" label="Meus Alunos" icon={<Users size={20} />} onClick={() => setMobileOpen(false)} />
            <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-white mt-4">
              <LogOut size={20} /> Sair
            </button>
         </nav>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'md:pl-20' : 'md:pl-72'}`}>
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-slate-100 flex items-center px-4 justify-between sticky top-0 z-10 shadow-sm">
          <span className="font-bold text-slate-800 flex items-center gap-2">
             <div className="text-blue-600"></div> CoreFlowFit
          </span>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg">
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavItem({ to, label, icon, collapsed, active, onClick }: any) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative overflow-hidden ${
        active 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <div className={`transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{icon}</div>
      {!collapsed && <span className="font-medium text-sm">{label}</span>}
      {active && !collapsed && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/20 rounded-l-full"></div>}
    </Link>
  )
}
