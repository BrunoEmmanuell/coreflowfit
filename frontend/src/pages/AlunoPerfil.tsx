import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";
import { Aluno, DashboardStats, TreinoGerado } from "../types/api";

const AlunoPerfil: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [historico, setHistorico] = useState<TreinoGerado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        if (!id) return;

        // 1. Busca Perfil e Dashboard
        const respPerfil = await api.get(`/alunos/${id}`);
        
        if (respPerfil.data.ok) {
          setAluno(respPerfil.data.aluno);
          const dash = respPerfil.data.dashboard || {
             stats: { treinosTotal: 0, progresso: 0 },
             proximoTreino: null,
             recentes: []
          };
          setDashboard(dash);
        }
        
        // 2. Busca Histórico de Treinos
        const respHistorico = await api.get(`/treinos/aluno/${id}?limit=50`);
        if (respHistorico.data.ok) {
          setHistorico(respHistorico.data.treinos);
        }

      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, [id]);

  if (loading) return <Layout><div className="text-white p-8 text-center">Carregando perfil...</div></Layout>;
  if (!aluno) return <Layout><div className="text-white p-8 text-center">Aluno não encontrado.</div></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header do Aluno */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{aluno.nome}</h1>
            <div className="flex gap-3 text-sm text-slate-400">
              <span className="bg-slate-700 px-2 py-0.5 rounded text-slate-300">{aluno.objetivo}</span>
              <span className="bg-slate-700 px-2 py-0.5 rounded text-slate-300 capitalize">{aluno.nivel_experiencia}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link to={`/evolucao/${aluno.id}`} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition">
              📈 Ver Evolução
            </Link>
            <button onClick={() => navigate(`/treino/novo?aluno_id=${aluno.id}`)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
              ⚡ Gerar Novo Treino
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Rápidos */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
              <h3 className="text-slate-400 text-sm font-semibold uppercase mb-4">Resumo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                  <span className="block text-2xl font-bold text-white">{dashboard?.stats.treinosTotal || 0}</span>
                  <span className="text-xs text-slate-400">Treinos Gerados</span>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                  <span className="block text-2xl font-bold text-emerald-400">{dashboard?.stats.progresso || 0}%</span>
                  <span className="text-xs text-slate-400">Consistência</span>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico de Treinos */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4">Histórico de Treinos</h2>
            <div className="space-y-4">
              {historico.length === 0 ? (
                <p className="text-slate-500">Nenhum treino registrado.</p>
              ) : (
                historico.map((treino, index) => {
                  const isLatest = index === 0;
                  return (
                    <div key={treino.id} className={`relative flex items-center justify-between p-5 rounded-xl border transition group ${isLatest ? "bg-slate-800 border-blue-500/50 shadow-blue-900/10 shadow-lg" : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600"}`}>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className={`font-bold text-lg ${isLatest ? 'text-white' : 'text-slate-300'}`}>
                            {treino.divisao ? `Divisão ${treino.divisao}` : 'Treino Personalizado'}
                          </h3>
                          {isLatest && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 animate-pulse">ATUAL</span>}
                        </div>
                        <div className="text-xs text-slate-400 flex gap-3">
                          <span className="flex items-center gap-1">📅 {new Date(treino.gerado_em).toLocaleDateString('pt-BR')}</span>
                          <span className="flex items-center gap-1">🎯 {treino.objetivo || "Hipertrofia"}</span>
                        </div>
                      </div>
                      <Link to={`/treino/${treino.id}`} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${isLatest ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"}`}>
                        Ver Treino
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AlunoPerfil;