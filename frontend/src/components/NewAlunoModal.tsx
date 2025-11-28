
import React from 'react';
import { useForm } from 'react-hook-form';
import { useAlunos } from '../hook/useAlunos';

export default function NewAlunoModal() {
  const { criarAluno } = useAlunos();
  const { register, handleSubmit } = useForm();

  async function onSubmit(data: any) {
    try { await criarAluno(data); alert('Aluno criado'); }
    catch (e:any) { alert(e?.message || 'Erro'); }
  }

  return (
    <div className="p-4 border rounded bg-white">
      <h3 className="font-bold mb-2">Novo Aluno</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <input {...register('nome')} placeholder="Nome" className="w-full p-2 border rounded" />
        <input {...register('idade')} placeholder="Idade" className="w-full p-2 border rounded" />
        <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Criar</button>
      </form>
    </div>
  );
}
