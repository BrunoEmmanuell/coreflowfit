import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/Layout";
import api from "../services/api";
import { TreinoGerado } from "../types/api";

const HistoricoTreinos: React.FC = () => {
  const [treinos, setTreinos] = useState<TreinoGerado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        const response = await api.get<{ ok: boolean; treinos: TreinoGerado[] }>("/treinos/");
        if (response.data.ok) setTreinos(response.data.treinos);
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
        <h1 className="text-3xl font-bold text-white">HistÃ³rico Geral</h1>
        {loading ? <p className="text-slate-400">Carregando...</p> : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4">Aluno</th>
                  <th className="px-6 py-4">Objetivo</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4 text-right">AÃ§Ã£o</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-slate-300">
                {(treinos as any[]).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 font-medium text-white">{t.aluno_nome || "Aluno"}</td>
                    <td className="px-6 py-4">{t.objetivo || "-"}</td>
                    <td className="px-6 py-4">{new Date(t.gerado_em).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/treino/${t.id}`} className="text-blue-400 hover:underline text-sm">Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {treinos.length === 0 && <div className="p-8 text-center text-slate-500">Nenhum treino encontrado.</div>}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HistoricoTreinos;
