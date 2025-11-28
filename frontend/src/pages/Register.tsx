
import React from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Register(){
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  async function onSubmit(data:any){
    try {
      await api.post('/api/v1/instrutores/register', data);
      alert('Registrado com sucesso. Faça login.');
      navigate('/login');
    } catch (e:any) { alert(e?.response?.data?.detail || e.message || 'Erro'); }
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input {...register('username')} placeholder="username" className="w-full p-2 border rounded" />
        <input {...register('email')} placeholder="email" className="w-full p-2 border rounded" />
        <input {...register('password')} type="password" placeholder="password" className="w-full p-2 border rounded" />
        <button type="submit" className="w-full py-2 bg-green-600 text-white rounded">Registrar</button>
      </form>
    </div>
  );
}
