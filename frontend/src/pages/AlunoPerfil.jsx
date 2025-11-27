// src/pages/AlunoPerfil.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../js/api";

const AlunoPerfil = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [aluno, setAluno] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        // 1. Busca Perfil e Dashboard
        const respPerfil = await api.get(`/api/v1/alunos/${id}`);
        
        if (respPerfil.data.ok) {
          setAluno(respPerfil.data.aluno);
          
          // PROTEÇÃO DE DADOS: Se 'dashboard' vier nulo, cria um objeto vazio
          const dash = respPerfil.data.dashboard || {
             stats: { treinosTotal: 0, progresso: 0 },
             proximoTreino: null,
             recentes: []
          };
          setDashboard(dash);
        }
        
        // 2. Busca Histórico
        const respHistorico = await api.get(`/api/v1/treinos/aluno/${id}?limit=50`);
        if (respHistorico.data.ok) setHistorico(respHistorico.data.treinos);

      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        alert("Erro ao carregar dados do aluno."); 
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, [id]);

  const handleGerarTreino = async () => {
    if (!aluno) return;
    if (!confirm(`Gerar novo treino para ${aluno.nome}?`)) return;
    try {
      alert("🤖 A IA está a criar o treino... Aguarde!");
      const response = await api.post("/api/v1/ia/gerar-treino", {
        aluno_id: id,
        divisao_preferida: "auto"
      });
      if (response.data.ok) {
        alert("✅ Treino Criado!");
        window.location.reload(); 
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar treino. Verifique se o backend está rodando.");
    }
  };

  if (loading) return <Layout><div className="p-12 text-center text-slate-400 animate-pulse">Carregando perfil...</div></Layout>;
  if (!aluno) return <Layout><div className="p-12 text-center text-red-400">Aluno não encontrado.</div></Layout>;

  // Safe Access (Evita o erro "reading 'stats'")
  const stats = dashboard?.stats || { treinosTotal: 0, progresso: 0 };
  const proximoTreino = dashboard?.proximoTreino;
  const dataCadastro = new Date(aluno.criado_em).toLocaleDateString('pt-BR');
  const divisaoAtual = proximoTreino ? proximoTreino.nome.split('-')[0] : "Auto";

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
          <div>
            <Link to="/" className="text-slate-400 hover:text-white text-sm mb-1 block transition">← Voltar para Lista</Link>
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/30">
                    {aluno.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">{aluno.nome}</h1>
                    <p className="text-slate-400 text-sm flex gap-2">
                        <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">{aluno.objetivo}</span>
                        <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">{aluno.nivel_experiencia}</span>
                    </p>
                </div>
            </div>
          </div>
          <button 
            onClick={handleGerarTreino}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/20 transition transform hover:scale-105 flex items-center gap-2"
          >
            <span>🤖</span> Gerar Novo Treino
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-5 rounded-xl border-l-4 border-blue-500 shadow-lg">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Total Treinos</p>
            <p className="text-3xl font-bold text-white mt-1">{stats.treinosTotal}</p>
          </div>
          <div className="bg-slate-800 p-5 rounded-xl border-l-4 border-green-500 shadow-lg">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Último Treino</p>
            <p className="text-lg font-bold text-white mt-1 truncate">
              {proximoTreino ? new Date(proximoTreino.data).toLocaleDateString('pt-BR') : "-"}
            </p>
          </div>
          <div className="bg-slate-800 p-5 rounded-xl border-l-4 border-purple-500 shadow-lg">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Divisão Atual</p>
            <p className="text-xl font-bold text-white mt-1 uppercase">{divisaoAtual}</p>
          </div>
          <div className="bg-slate-800 p-5 rounded-xl border-l-4 border-yellow-500 shadow-lg">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Status</p>
            <p className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                Ativo <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Coluna Esquerda: Ficha e Ações */}
          <div className="space-y-6">
              <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    📋 Ficha Técnica
                </h2>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4 bg-slate-900/50 p-3 rounded-lg">
                    <div>
                       <p className="text-slate-500 text-xs">Peso Atual</p>
                       <p className="text-white font-medium text-lg">{aluno.peso_kg || "-"} <span className="text-sm text-slate-500">kg</span></p>
                    </div>
                    <div>
                       <p className="text-slate-500 text-xs">Altura</p>
                       <p className="text-white font-medium text-lg">{aluno.altura_m || "-"} <span className="text-sm text-slate-500">m</span></p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Observações / Saúde</p>
                    <div className="bg-slate-700/30 p-3 rounded text-slate-300 min-h-[60px] border border-slate-700/50">
                      {aluno.observacoes || "Nenhuma observação registrada."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
                <h2 className="text-lg font-bold text-white mb-4">⚡ Ações Rápidas</h2>
                <div className="grid grid-cols-1 gap-3">
                    <Link to={`/aluno/${id}/evolucao`} className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg transition flex items-center justify-between group">
                        <span className="font-medium">📈 Ver Evolução</span>
                        <span className="text-slate-400 group-hover:text-white">→</span>
                    </Link>
                    {/* Botão sem ação por enquanto, apenas visual */}
                    <button className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg transition flex items-center justify-between group opacity-50 cursor-not-allowed" title="Em breve">
                        <span className="font-medium">📝 Nova Avaliação</span>
                        <span className="text-slate-400 group-hover:text-white">+</span>
                    </button>
                </div>
              </div>
          </div>

          {/* Coluna Direita: Histórico */}
          <div className="lg:col-span-2 bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 flex flex-col h-[600px]">
            <h2 className="text-lg font-bold text-white mb-4 flex justify-between items-center">
              <span>📚 Histórico de Treinos</span>
              <span className="text-xs font-normal text-slate-400 bg-slate-700 px-2 py-1 rounded">
                {historico.length} total
              </span>
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {historico.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <p className="text-4xl mb-2">📭</p>
                    <p>Nenhum treino gerado ainda.</p>
                    <button onClick={handleGerarTreino} className="text-blue-400 hover:underline mt-2">Gerar o primeiro agora</button>
                </div>
              ) : (
                historico.map((treino, index) => {
                  const numeroTreino = historico.length - index;
                  const isLatest = index === 0;

                  return (
                    <div 
                      key={treino.id} 
                      className={`p-4 rounded-xl border transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden ${
                        isLatest 
                          ? "bg-blue-900/10 border-blue-500/50 hover:bg-blue-900/20" 
                          : "bg-slate-700/30 border-slate-700 hover:bg-slate-700/50"
                      }`}
                    >
                      {isLatest && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${isLatest ? "bg-blue-600 text-white" : "bg-slate-600 text-slate-300"}`}>
                            #{numeroTreino}
                          </span>
                          <h3 className="text-white font-bold">
                            Treino {treino.divisao || "Geral"}
                          </h3>
                          {isLatest && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 animate-pulse">ATUAL</span>}
                        </div>
                        <div className="text-xs text-slate-400 flex gap-3">
                          <span className="flex items-center gap-1">📅 {new Date(treino.gerado_em).toLocaleDateString('pt-BR')}</span>
                          <span className="flex items-center gap-1">🎯 {treino.objetivo || "Hipertrofia"}</span>
                          <span className="flex items-center gap-1">💪 {treino.total_exercicios} exercícios</span>
                        </div>
                      </div>

                      <Link 
                        to={`/treino/${treino.id}`}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                          isLatest 
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30" 
                            : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                        }`}
                      >
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