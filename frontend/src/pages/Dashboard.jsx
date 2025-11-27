// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import ModalNovoAluno from "../components/ModalNovoAluno";
import api from "../js/api";

const Dashboard = () => {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busca, setBusca] = useState(""); 

  const fetchAlunos = async () => {
    try {
      const response = await api.get("/api/v1/alunos/");
      if (response.data.ok) {
        setAlunos(response.data.alunos);
      }
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlunos();
  }, []);

  // Filtragem
  const alunosFiltrados = alunos.filter(aluno => 
    aluno.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Meus Alunos</h1>
            <p className="text-slate-400">Gerencie o acesso e os perfis dos seus clientes</p>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
          >
            <span>+</span> Novo Aluno
          </button>
        </div>

        {/* Barra de Busca */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="relative w-full sm:w-96">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar aluno por nome..." 
              className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="text-slate-400 text-sm font-medium">
            Total: <span className="text-white font-bold text-lg">{alunos.length}</span> alunos
          </div>
        </div>

        {/* Lista */}
        <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700">
          
          {loading ? (
            <div className="p-12 text-center text-slate-400">Carregando lista...</div>
          ) : alunosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              {busca ? "Nenhum aluno encontrado." : "Nenhum aluno cadastrado."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Aluno</th>
                    <th className="px-6 py-4">Objetivo</th>
                    <th className="px-6 py-4">Nível</th>
                    <th className="px-6 py-4 text-right">Acesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {alunosFiltrados.map((aluno) => (
                    <tr key={aluno.id} className="hover:bg-slate-700/30 transition group">
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {aluno.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white group-hover:text-blue-400 transition">{aluno.nome}</div>
                            <div className="text-xs text-slate-500">Desde {new Date(aluno.criado_em).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {aluno.objetivo}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          aluno.nivel_experiencia === 'Iniciante' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                          aluno.nivel_experiencia === 'Intermediario' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {aluno.nivel_experiencia}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/aluno/${aluno.id}`} 
                          className="text-blue-400 hover:text-white font-medium text-sm hover:underline transition"
                        >
                          Abrir Perfil →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && <ModalNovoAluno onClose={() => setShowModal(false)} onSucesso={fetchAlunos} />}
    </Layout>
  );
};

export default Dashboard;