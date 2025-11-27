// src/pages/Treino.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../js/api";

const Treino = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [treino, setTreino] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Busca o treino REAL no backend
  useEffect(() => {
    const fetchTreino = async () => {
      try {
        const response = await api.get(`/api/v1/treinos/${id}`);
        setTreino(response.data);
      } catch (err) {
        console.error("Erro ao buscar treino:", err);
        setErro("Treino não encontrado ou erro de conexão.");
      } finally {
        setLoading(false);
      }
    };
    fetchTreino();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este treino?")) return;
    try {
      await api.delete(`/api/v1/treinos/${id}`);
      alert("Treino excluído!");
      navigate("/");
    } catch (err) {
      alert("Erro ao excluir.");
    }
  };

  if (loading) return <Layout><div className="p-10 text-center text-slate-400">Carregando treino...</div></Layout>;
  if (erro) return <Layout><div className="p-10 text-center text-red-400">{erro}</div></Layout>;

  // Extrai os dados reais do JSON da IA
  // O backend agora garante que 'conteudo_json' é um objeto válido
  const conteudo = treino.conteudo_json || {};
  const plano = conteudo.plano || [];
  const meta = conteudo.meta || {};
  const nomeAluno = treino.nome_aluno || "Aluno";

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-slate-700 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <Link to="/" className="text-slate-400 hover:text-white text-sm transition">← Voltar</Link>
            </div>
            <h1 className="text-3xl font-bold text-white">Treino de {nomeAluno}</h1>
            <div className="flex gap-3 mt-2">
              <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs border border-blue-600/30 uppercase">
                {conteudo.objetivo || "Hipertrofia"}
              </span>
              <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-xs border border-purple-600/30 uppercase">
                Divisão: {meta.split_usado || "Auto"}
              </span>
              <span className="text-slate-400 text-xs flex items-center">
                📅 {new Date(treino.gerado_em).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              🖨️ Imprimir
            </button>
            <button onClick={handleDelete} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition border border-red-600/30">
              Excluir
            </button>
          </div>
        </div>

        {/* Explicação da IA */}
        {meta.explicacoes && meta.explicacoes.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
            <h3 className="text-yellow-400 font-bold mb-2 text-sm">🤖 Notas da Inteligência Artificial:</h3>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
              {meta.explicacoes.map((exp, i) => (
                <li key={i}>{exp}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Dias de Treino (Agora sim, os exercícios da IA!) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plano.map((dia, index) => (
            <div key={index} className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700">
              <div className="bg-slate-700/50 p-4 border-b border-slate-700 flex justify-between items-center">
                <div>
                  <span className="text-blue-400 font-bold text-lg mr-2">Treino {dia.dia}</span>
                  <span className="text-slate-300 text-sm">{dia.nome_dia}</span>
                </div>
                <span className="text-slate-500 text-xs">{dia.exercicios.length} exercícios</span>
              </div>
              
              <div className="p-4 space-y-3">
                {dia.exercicios.map((ex, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition border border-slate-700/30">
                    <div>
                      <p className="text-white font-medium text-sm">{ex.exercicio}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {ex.series} séries x {ex.repeticoes} reps
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded block">
                        {ex.descanso} desc
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {plano.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Erro ao carregar plano de treino.
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Treino;