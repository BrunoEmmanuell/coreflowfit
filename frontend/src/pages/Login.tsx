
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hook/useAuth';

type FormData = { email: string; password: string };

export default function Login(){
  const { register, handleSubmit } = useForm<FormData>();
  const auth = useAuth(); const navigate = useNavigate();

  async function onSubmit(data: FormData){
    try {
      await auth.login(data.email, data.password);
      navigate('/');
    } catch (e:any) {
      alert(e?.response?.data?.detail || e.message || 'Erro no login');
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input {...register('email')} placeholder="Email / username" className="w-full p-2 border rounded" />
        <input {...register('password')} type="password" placeholder="Senha" className="w-full p-2 border rounded" />
        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded">Entrar</button>
      </form>
    </div>
  );
}
