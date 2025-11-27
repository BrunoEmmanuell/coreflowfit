// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import api from "../js/api"; // Importe a API configurada

const Login = () => {
  const [username, setUsername] = useState(""); // Backend usa username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // O FastAPI OAuth2 espera Form Data (username/password)
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post("/api/v1/auth/login", formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      // Sucesso
      const { access_token } = response.data;
      localStorage.setItem("token", access_token);
      
      // Salva dados básicos do usuário
      localStorage.setItem("user", JSON.stringify({ username: username }));
      
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Falha no login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* NOME CORRIGIDO */}
          <h1 className="text-3xl font-bold text-white mb-2">💪 CoreFlowFit</h1>
          <p className="text-slate-400">Área do Instrutor</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-slate-400 text-sm mb-2">Username</label>
            <input
              type="text"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Seu usuário de instrutor"
            />
          </div>
          
          <div>
            <label className="block text-slate-400 text-sm mb-2">Senha</label>
            <input
              type="password"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="text-center mt-4">
            <p className="text-slate-400 text-sm">
              Não tem conta?{" "}
              <Link to="/register" className="text-blue-500 hover:text-blue-400">
                Criar conta
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;