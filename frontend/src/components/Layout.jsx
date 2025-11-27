// src/components/Layout.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // MENU LIMPO: Apenas Dashboard (Lista de Alunos)
  const navigation = [
    { name: "Meus Alunos", href: "/", icon: "👥" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  let userName = "Instrutor";
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
        const userObj = JSON.parse(userStr);
        userName = userObj.sub || userObj.username || userObj.nome || "Instrutor";
    }
  } catch (e) { console.error(e) }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2 hover:opacity-80 transition">
                <span className="text-2xl">💪</span>
                <span className="text-xl font-bold text-white tracking-tight">CoreFlowFit</span>
              </Link>
              
              {/* Navegação Principal */}
              <nav className="ml-8 flex space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.href
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "text-slate-300 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-white">{userName}</span>
                <span className="text-xs text-slate-400">Personal Trainer</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;