import React, { useEffect, useState } from 'react';
import api from '../services/api'; 
import { Aluno } from '../types/api'; 

const Dashboard: React.FC = () => {
  // O Estado agora sabe que é uma lista de 'Aluno'
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlunos = async () => {
    try {
      setLoading(true);
      // O axios agora sabe que o retorno é Aluno[]
      const response = await api.get<Aluno[]>('/alunos'); 
      setAlunos(response.data);
    } catch (err) {
      setError('Erro ao carregar alunos. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlunos();
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard do Instrutor</h1>
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h2 className="text-gray-500 text-sm font-semibold">Total de Alunos</h2>
          <p className="text-3xl font-bold mt-2">{alunos.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h2 className="text-gray-500 text-sm font-semibold">Alunos Ativos</h2>
          <p className="text-3xl font-bold mt-2">{alunos.length} <span className="text-xs text-gray-400 font-normal">(Simulado)</span></p>
        </div>
      </div>

      {/* Tabela de Alunos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-700">Meus Alunos</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
              <th className="p-4 border-b">Nome</th>
              <th className="p-4 border-b">Objetivo</th>
              <th className="p-4 border-b">Nível</th>
              <th className="p-4 border-b">Data Cadastro</th>
              <th className="p-4 border-b">Ações</th>
            </tr>
          </thead>
          <tbody>
            {alunos.length > 0 ? (
              alunos.map((aluno) => (
                <tr key={aluno.id} className="hover:bg-gray-50 border-b last:border-0 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{aluno.nome}</td>
                  <td className="p-4 text-gray-700">{aluno.objetivo || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${aluno.nivel_experiencia === 'Iniciante' ? 'bg-green-100 text-green-800' : 
                        aluno.nivel_experiencia === 'Avancado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {aluno.nivel_experiencia || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(aluno.criado_em).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver Detalhes</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Nenhum aluno encontrado. Cadastre o primeiro!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;