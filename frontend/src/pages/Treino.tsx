import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";
import { TreinoGerado } from "../types/api";

const Treino: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [treino, setTreino] = useState<TreinoGerado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTreino = async () => {
      try {
        const response = await api.get<TreinoGerado>(`/treinos/${id}`);
        setTreino(response.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchTreino();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("Excluir este treino?")) {
      try { await api.delete(`/treinos/${id}`); navigate("/"); } catch (err) { alert("Erro ao excluir"); }
    }
  };

  if (loading) return <Layout><div className="text-white p-8">Carregando...</div></Layout>;
  if (!treino) return <Layout><div className="text-red-400 p-8">Treino não encontrado.</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Treino de {treino.objetivo}</h1>
            <button onClick={handleDelete} className="text-red-400 hover:text-red-300 text-sm border border-red-900/50 px-4 py-2 rounded">Excluir</button>
        </div>
        
        {treino.conteudo_json?.map((dia, idx) => (
            <div key={idx} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="bg-slate-900/50 p-4 border-b border-slate-700"><span className="text-blue-400 font-bold">Dia {dia.dia}</span> - {dia.nome_dia}</div>
                <div className="p-4 space-y-2">
                    {dia.exercicios.map((ex, i) => (
                        <div key={i} className="flex justify-between p-3 bg-slate-700/20 rounded">
                            <span className="text-white font-medium">{ex.exercicio}</span>
                            <span className="text-slate-400 text-sm">{ex.series}x {ex.repeticoes} ({ex.descanso})</span>
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>
    </Layout>
  );
};

export default Treino;