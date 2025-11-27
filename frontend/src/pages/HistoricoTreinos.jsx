// src/pages/HistoricoTreinos.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../js/api";

const HistoricoTreinos = () => {
  const [treinos, setTreinos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        // Rota que lista os treinos recentes do instrutor
        const response = await api.get("/api/v1/treinos/");
        if (response.data.ok) {
          setTreinos(response.data.treinos);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorico();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Histórico de Treinos</h1>
        
        {loading ? (
          <p className="text-slate-400">Carregando...</p>
        ) : treinos.length === 0 ? (
          <div className="bg-slate-800 p-8 rounded-xl text-center text-slate-500">
            Nenhum treino gerado ainda.
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-700/50 text-slate-300 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Aluno</th>
                    <th className="px-6 py-4">Divisão</th>
                    <th className="px-6 py-4">Objetivo</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {treinos.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4 font-medium text-white">{t.aluno_nome}</td>
                      <td className="px-6 py-4">
                        <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs uppercase font-bold">
                          {t.divisao || "Auto"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{t.objetivo || "-"}</td>
                      {/* CORREÇÃO AQUI: Fechando corretamente com </td> */}
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(t.gerado_em).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/treino/${t.id}`}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline"
                        >
                          Ver Detalhes →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HistoricoTreinos;