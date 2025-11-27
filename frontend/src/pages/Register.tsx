import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validações no frontend
    if (username.length < 3) {
      setError("O usuário deve ter pelo menos 3 caracteres.");
      return;
    }
    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (!email.includes("@")) {
      setError("Digite um e-mail válido.");
      return;
    }

    setLoading(true);

    try {
      // CORREÇÃO: Enviando os campos exatos que o Schema do Backend (Pydantic) exige
      const payload = {
        nome_completo: nome,  // Backend espera: nome_completo
        email: email,
        username: username,
        password: senha       // Backend espera: password
      };

      await api.post("/auth/register", payload);
      
      alert("Conta criada com sucesso! Faça login.");
      navigate("/login");
      
    } catch (err: any) {
      console.error(err);
      
      // Tratamento de erros detalhado
      if (err.response?.status === 422) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          // Erro de validação específico (ex: formato de email)
          const campo = detail[0].loc[1];
          const msg = detail[0].msg;
          setError(`Erro no campo '${campo}': ${msg}`);
        } else {
          setError(detail);
        }
      } else if (err.response?.status === 400) {
        // Erro de negócio (ex: usuário já existe)
        setError(err.response.data.detail);
      } else {
        setError("Erro ao conectar com o servidor. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Crie sua Conta 🚀</h1>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded mb-4 text-center text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-300">Nome Completo</label>
            <input
              type="text"
              className="w-full bg-slate-700 border border-slate-600 rounded p-3 text-white focus:outline-none focus:border-blue-500 transition"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Bruno Silva"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              className="w-full bg-slate-700 border border-slate-600 rounded p-3 text-white focus:outline-none focus:border-blue-500 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-300">Usuário (Login)</label>
            <input
              type="text"
              className="w-full bg-slate-700 border border-slate-600 rounded p-3 text-white focus:outline-none focus:border-blue-500 transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Mínimo 3 caracteres"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-300">Senha</label>
            <input
              type="password"
              className="w-full bg-slate-700 border border-slate-600 rounded p-3 text-white focus:outline-none focus:border-blue-500 transition"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 mt-4 rounded-lg text-white font-bold transition shadow-lg ${
              loading 
                ? "bg-slate-600 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/20"
            }`}
          >
            {loading ? "Criando..." : "Cadastrar"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Já tem conta?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium hover:underline">
              Faça Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}