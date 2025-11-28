import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hook/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { User, Lock } from 'lucide-react';

type FormData = { username: string; password: string };

export default function Login() {
  const { register, handleSubmit } = useForm<FormData>();
  const auth = useAuth();
  const navigate = useNavigate();

  async function onSubmit(data: FormData) {
    try {
      // Agora envia o username em vez do email
      await auth.login(data.username, data.password);
      navigate('/');
    } catch (e: any) {
      alert(e?.response?.data?.detail || e.message || 'Erro no login');
    }
  }

  return (
    // Fundo: Gradiente Azul Profundo (Fiel ao Mockup)
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400 via-blue-600 to-indigo-900 p-4">
      
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-8 relative">
        
        {/* --- Header da Logo --- */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-3">
            {/* Ícone: Silhueta de Corrida (Estilo CoreFlowFit) */}
            <svg className="w-9 h-9 text-blue-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.5 6C17.8807 6 19 4.88071 19 3.5C19 2.11929 17.8807 1 16.5 1C15.1193 1 14 2.11929 14 3.5C14 4.88071 15.1193 6 16.5 6Z" />
              <path d="M12.5 7.5C10.85 7.5 9.6 7.9 8.6 8.5L3.5 11.2L4.8 13.6L8.5 11.6V17.5L5 22.5L7.5 24L11.5 18.5L14 21V24H16.5V19.5L13.5 16.5V11.5L16.5 14.5L18.8 12.8C18.8 12.8 17.5 8.5 16.5 8C15.5 7.5 13.5 7.5 12.5 7.5Z" />
            </svg>
            
            {/* Tipografia da Marca */}
            <div className="text-2xl font-bold tracking-tight">
              <span className="text-blue-600">Core</span>
              <span className="text-slate-700">FlowFit</span>
            </div>
          </div>
          <h2 className="text-slate-600 font-medium text-sm">Entre na sua conta</h2>
        </div>

        {/* --- Formulário --- */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-4">
            <Input 
              {...register('username')} 
              placeholder="Seu usuário" 
              leftIcon={<User size={18} className="text-slate-400" />}
              className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm"
            />
            <Input 
              {...register('password')} 
              type="password" 
              placeholder="Senha"
              leftIcon={<Lock size={18} className="text-slate-400" />}
              className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm" 
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
              />
              <label htmlFor="remember" className="text-xs text-slate-500 select-none cursor-pointer font-medium">Manter-me conectado</label>
            </div>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full h-11 text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md shadow-blue-500/20 border-none rounded-lg transition-all"
          >
            Entrar
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Não tem conta?{' '}
            <Link to="/register" className="text-slate-700 font-bold hover:text-blue-600 hover:underline transition-colors">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
