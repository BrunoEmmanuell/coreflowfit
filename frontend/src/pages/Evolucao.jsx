// src/pages/Evolucao.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Layout from "../components/Layout";
import api from "../js/api";

const Evolucao = () => {
  const { id } = useParams();
  const [aluno, setAluno] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        // 1. Pega nome do aluno
        const respAluno = await api.get(`/api/v1/alunos/${id}`);
        if (respAluno.data.ok) setAluno(respAluno.data.aluno);

        // 2. Pega histórico
        const respHist = await api.get(`/api/v1/medidas/aluno/${id}`);
        if (respHist.data.ok) {
            // Formata dados para o gráfico (inverte para ficar cronológico: antigo -> novo)
            const dadosFormatados = respHist.data.historico.reverse().map(h => ({
                ...h,
                // Formata data curta (ex: 25/11)
                data_curta: new Date(h.data_medida).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            }));
            setHistorico(dadosFormatados);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDados();
  }, [id]);

  if (loading) return <Layout><div className="p-12 text-center text-slate-400">A carregar gráficos...</div></Layout>;
  if (!historico.length) return <Layout>
    <div className="p-12 text-center text-slate-500">
        <p className="text-4xl mb-4">📉</p>
        <p>Ainda não há histórico suficiente para gerar gráficos.</p>
        <Link to="/" className="text-blue-400 hover:underline block mt-4">Voltar</Link>
    </div>
  </Layout>;

  // Dados para comparação (Primeiro vs Último)
  const inicio = historico[0];
  const atual = historico[historico.length - 1];
  const evolucaoPeso = (atual.peso_kg - inicio.peso_kg).toFixed(1);
  const corEvolucao = evolucaoPeso < 0 ? "text-green-400" : "text-blue-400"; // Verde se perdeu, Azul se ganhou (depende do objetivo, mas ok por agora)

  return (
    <Layout>
      <div className="space-y-8 animate-fadeIn">
        
        {/* Header Simples */}
        <div className="flex justify-between items-center border-b border-slate-700 pb-4">
            <div>
                <Link to={`/aluno/${id}`} className="text-slate-400 text-sm hover:text-white">← Voltar ao Perfil</Link>
                <h1 className="text-2xl font-bold text-white mt-1">Evolução de {aluno?.nome}</h1>
            </div>
            <div className="text-right">
                <p className="text-xs text-slate-400">Variação de Peso</p>
                <p className={`text-2xl font-bold ${corEvolucao}`}>{evolucaoPeso > 0 ? '+' : ''}{evolucaoPeso} kg</p>
            </div>
        </div>

        {/* GRÁFICO 1: LINHA DO TEMPO (PESO) */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                ⚖️ Histórico de Peso
            </h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historico}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="data_curta" stroke="#9ca3af" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#9ca3af" tick={{fontSize: 12}} axisLine={false} tickLine={false} unit="kg" />
                        <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
                        <Line type="monotone" dataKey="peso_kg" stroke="#3b82f6" strokeWidth={4} dot={{r: 4, fill: '#3b82f6'}} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* GRÁFICO 2: BARRAS COMPARATIVAS (MEDIDAS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-6">📏 Tronco (Cintura/Quadril)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historico}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="data_curta" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px'}} />
                            <Legend />
                            <Line type="monotone" dataKey="cintura" stroke="#f59e0b" strokeWidth={3} name="Cintura" dot={false} />
                            <Line type="monotone" dataKey="quadril" stroke="#ec4899" strokeWidth={3} name="Quadril" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-6">💪 Braços (Direito vs Esquerdo)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historico}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="data_curta" stroke="#9ca3af" fontSize={12} />
                            <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#9ca3af" fontSize={12} />
                            <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px'}} />
                            <Legend />
                            <Line type="monotone" dataKey="braco_direito" stroke="#8b5cf6" strokeWidth={3} name="Dir" />
                            <Line type="monotone" dataKey="braco_esquerdo" stroke="#6366f1" strokeWidth={3} strokeDasharray="3 3" name="Esq" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

      </div>
    </Layout>
  );
};

export default Evolucao;