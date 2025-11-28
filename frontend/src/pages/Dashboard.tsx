
import React from 'react';
import { useAlunos } from '../hook/useAlunos';
import NewAlunoModal from '../components/NewAlunoModal';
import { Link } from 'react-router-dom';

export default function Dashboard(){
  const { alunos, isLoading, isError, refetch } = useAlunos();

  if (isLoading) return <div className="p-6">Carregando alunos...</div>;
  if (isError) return (
    <div className="p-6">
      Erro ao carregar alunos.
      <button onClick={() => refetch()} className="ml-3 px-3 py-1 bg-gray-200 rounded">Tentar novamente</button>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Meus Alunos</h1>
        <button onClick={() => refetch()} className="px-3 py-1 bg-blue-600 text-white rounded">Atualizar</button>
      </div>

      <div className="grid gap-3">
        <NewAlunoModal />
        {(!alunos || alunos.length === 0) && <div>Nenhum aluno cadastrado ainda.</div>}
        {alunos && alunos.map(aluno => (
          <div key={aluno.id} className="p-4 border rounded shadow-sm">
            <div className="font-medium">{aluno.nome}</div>
            <div className="text-sm text-gray-600">ID: {aluno.id}</div>
            <Link to={`/aluno/${aluno.id}`} className="text-blue-600">Ver perfil</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
