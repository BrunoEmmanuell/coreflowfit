import React, { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-blue-500">
              CoreFlowFit
            </Link>
            
            <div className="flex items-center gap-6">
              <Link to="/" className="text-slate-300 hover:text-white transition">Dashboard</Link>
              <Link to="/historico" className="text-slate-300 hover:text-white transition">Histórico</Link>
              <button 
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;