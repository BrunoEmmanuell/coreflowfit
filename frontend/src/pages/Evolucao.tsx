import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Layout from "../components/Layout";
import api from "../services/api";
import { Aluno, MedidasCorpo } from "../types/api";

const Evolucao: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [historico, setHistorico] = useState<MedidasCorpo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      if (!id) return;
      try {
        const respAluno = await api.get<{ ok: boolean; aluno: Aluno }>(`/alunos/${id}`);
        if (respAluno.data.ok) setAluno(respAluno.data.aluno);

        const respHist = await api.get<{ ok: boolean; historico: MedidasCorpo[] }>(`/medidas/aluno/${id}`);
        if (respHist.data.ok) {
            const dados = respHist.data.historico.reverse().map(h => ({
                ...h,
                data_curta: new Date(h.data_medida).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            }));
            setHistorico(dados);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchDados();
  }, [id]);

  if (loading) return <Layout><div className="text-white p-8">Carregando...</div></Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-white mb-6">Evolução: <span className="text-blue-400">{aluno?.nome}</span></h1>
      {historico.length < 2 ? (
        <div className="text-slate-500 bg-slate-800 p-8 rounded text-center">Precisa de pelo menos 2 medidas para gerar gráfico.</div>
      ) : (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-80">
            <h3 className="text-white mb-4 font-bold">Peso (kg)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="data_curta" stroke="#9ca3af" />
                    <YAxis domain={['auto', 'auto']} stroke="#9ca3af" />
                    <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none'}} />
                    <Legend />
                    <Line type="monotone" dataKey="peso_kg" stroke="#3b82f6" strokeWidth={3} />
                </LineChart>
            </ResponsiveContainer>
        </div>
      )}
    </Layout>
  );
};

export default Evolucao;