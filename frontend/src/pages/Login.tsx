import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // O endpoint espera Form-Data (padrão OAuth2 do FastAPI)
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      // Chamamos /auth/login (o api.ts já adiciona o /api/v1 antes)
      const response = await api.post("/auth/login", formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token } = response.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify({ username }));
      
      // Força recarregamento para aplicar o token
      window.location.href = "/";
    } catch (err: any) {
      console.error(err);
      setError("Usuário ou senha incorretos.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
        <h1 className="text-3xl font-bold text-white text-center mb-2">CoreFlowFit 🏋️‍♂️</h1>
        <p className="text-slate-400 text-center mb-8">Login do Instrutor</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-400 text-sm mb-2">Usuário</label>
            <input
              type="text"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
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
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/register" className="text-blue-400 hover:text-blue-300 text-sm">Criar nova conta</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;