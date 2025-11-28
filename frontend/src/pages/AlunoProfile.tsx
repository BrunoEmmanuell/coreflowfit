
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAluno } from '../hook/useAluno';
import { useTreinosDoAluno, useGerarTreino } from '../hook/useTreinos';

export default function AlunoProfile(){
  const { aluno_id } = useParams();
  const { data: aluno, isLoading } = useAluno(Number(aluno_id));
  const { data: treinos } = useTreinosDoAluno(Number(aluno_id));
  const gerar = useGerarTreino();

  if (isLoading) return <div className="p-6">Carregando perfil...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-3">{aluno?.nome || 'Aluno'}</h1>
      <div className="mb-4">
        <button onClick={() => gerar.mutate({ aluno_id: Number(aluno_id) })} className="px-3 py-1 bg-yellow-500 rounded">Gerar treino IA</button>
      </div>

      <div>
        <h2 className="font-semibold">Treinos recentes</h2>
        {treinos && treinos.length ? treinos.map((t:any)=> (
          <div key={t.id} className="p-2 border rounded my-2">{t.name || JSON.stringify(t)}</div>
        )) : <div>Nenhum treino</div>}
      </div>
    </div>
  );
}
