// src/pages/Register.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../js/api";

export default function Register() {
  const [nome, setNome] = useState(""); // Novo campo obrigatório
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(""); // Novo campo obrigatório
  const [senha, setSenha] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (username.length < 3 || senha.length < 6) {
      setError("Usuário (mín 3) e senha (mín 6) são obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      // Payload correto para o Backend (InstrutorCreate)
      const payload = {
        nome: nome,
        email: email,
        username: username,
        senha: senha // Note: Backend pede 'senha' no Pydantic, nao 'password'
      };

      // O Registro usa JSON, não Form-Data
      await api.post("/api/v1/auth/register", payload);

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 1500);
      
    } catch (err: any) {
      console.error("Erro no registro:", err);
      const data = err.response?.data;
      let msg = data?.detail || "Erro ao registrar instrutor.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md space-y-4"
      >
        <h1 className="text-3xl font-bold text-center text-white mb-2">
          💪 CoreFlowFit
        </h1>
        <p className="text-center text-slate-400 mb-6 text-sm">
          Crie sua conta de Instrutor
        </p>

        {success && (
          <div className="text-sm text-emerald-400 bg-emerald-900/30 border border-emerald-500/50 rounded p-3 text-center">
            Conta criada com sucesso! Redirecionando...
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-900/30 border border-red-500/50 rounded p-3 text-center">
            {error}
          </div>
        )}

        <div>
            <label className="block mb-1 text-sm font-medium text-slate-300">Nome Completo</label>
            <input
            type="text"
            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            />
        </div>

        <div>
            <label className="block mb-1 text-sm font-medium text-slate-300">Email</label>
            <input
            type="email"
            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            />
        </div>

        <div>
            <label className="block mb-1 text-sm font-medium text-slate-300">Username (Login)</label>
            <input
            type="text"
            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            />
        </div>

        <div>
            <label className="block mb-1 text-sm font-medium text-slate-300">Senha</label>
            <input
            type="password"
            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className={`w-full py-3 mt-4 rounded-lg text-white font-medium transition ${
            loading || success
              ? "bg-slate-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Criando..." : "Criar Conta"}
        </button>

        <div className="mt-4 text-center">
          <span className="text-sm text-slate-400 mr-1">
            Já tem uma conta?
          </span>
          <Link to="/login" className="text-sm text-blue-500 hover:underline">
            Fazer Login
          </Link>
        </div>
      </form>
    </div>
  );
}