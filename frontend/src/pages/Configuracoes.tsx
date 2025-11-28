import React from 'react'
import { useForm } from 'react-hook-form'
import api from '@/services/api'
import Layout from '@/components/layout/Layout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { UserPlus, Shield, Mail, Lock, User } from 'lucide-react'

export default function Configuracoes() {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  async function handleCreateAdmin(data: any) {
    try {
      await api.post('/api/v1/instrutores/register', data)
      alert('Novo instrutor cadastrado com sucesso!')
      reset()
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erro ao criar instrutor')
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
          <p className="text-slate-500 text-sm">Gerencie sua conta e acessos do sistema</p>
        </div>

        {/* Card de Criação de Instrutor */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Cadastrar Novo Instrutor</h2>
              <p className="text-sm text-slate-500">Adicione novos administradores ao sistema</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(handleCreateAdmin)} className="space-y-4 max-w-lg">
            <Input 
              label="Nome de Usuário" 
              placeholder="ex: admin_joao" 
              leftIcon={<User size={18} />}
              {...register('username', { required: true })} 
            />
            
            <Input 
              label="Email" 
              type="email"
              placeholder="joao@coreflowfit.com" 
              leftIcon={<Mail size={18} />}
              {...register('email', { required: true })} 
            />

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Senha" 
                type="password"
                placeholder="******" 
                leftIcon={<Lock size={18} />}
                {...register('password', { required: true })} 
              />
              <div className="flex items-end">
                <Button type="submit" variant="primary" loading={isSubmitting} className="w-full gap-2">
                  <UserPlus size={18} /> Criar Acesso
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Outras configurações futuras podem vir aqui... */}
      </div>
    </Layout>
  )
}
