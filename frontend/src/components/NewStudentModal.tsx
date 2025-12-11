import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import Modal from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { User, Mail, Ruler, Scale } from 'lucide-react'

type StudentFormData = {
  nome: string
  email: string
  idade: number
  peso: number
  altura: number
  objetivo: string
  nivel: string
  genero: string
}

const OBJETIVOS = [
  { value: 'Hipertrofia', label: 'Hipertrofia' },
  { value: 'Emagrecimento', label: 'Emagrecimento' },
  { value: 'Condicionamento', label: 'Condicionamento' },
  { value: 'Força', label: 'Força' },
]

const NIVEIS = [
  { value: 'Iniciante', label: 'Iniciante' },
  { value: 'Intermediário', label: 'Intermediário' },
  { value: 'Avançado', label: 'Avançado' },
]

export default function NewStudentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue, watch } = useForm<StudentFormData>()
  
  // Mutation para criar aluno
  const { mutateAsync: criarAluno, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/api/v1/alunos/completo', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
    }
  })

  // Resetar form quando abrir/fechar
  useEffect(() => { if(!open) reset() }, [open, reset])

  async function onSubmit(data: StudentFormData) {
    try {
      await criarAluno({
        ...data,
        idade: Number(data.idade),
        peso: Number(data.peso),
        altura: Number(data.altura)
      })
      alert('Aluno cadastrado com sucesso!')
      onClose()
    } catch (e: any) {
      alert(e?.message || 'Erro ao criar aluno')
    }
  }

  // Helpers para Select
  const objetivoValue = watch('objetivo')
  const nivelValue = watch('nivel')

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title={<span className="text-xl font-bold text-slate-800">Novo Aluno</span>}
      size="lg"
    >
      <form id="new-student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Dados Pessoais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Nome Completo" 
            placeholder="Ex: Ana Souza" 
            leftIcon={<User size={18} />} 
            {...register('nome', { required: true })} 
          />
          <Input 
            label="Email (Login)" 
            placeholder="email@exemplo.com" 
            leftIcon={<Mail size={18} />} 
            {...register('email', { required: true })} 
          />
        </div>

        {/* Métricas Físicas */}
        <div className="grid grid-cols-3 gap-4">
          <Input 
            label="Idade" 
            type="number" 
            placeholder="Anos" 
            {...register('idade')} 
          />
          <Input 
            label="Peso (kg)" 
            type="number" 
            step="0.1"
            leftIcon={<Scale size={18} />} 
            {...register('peso')} 
          />
          <Input 
            label="Altura (cm)" 
            type="number" 
            leftIcon={<Ruler size={18} />} 
            {...register('altura')} 
          />
        </div>

        {/* Perfil de Treino */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Objetivo</label>
            <Select 
              options={OBJETIVOS}
              value={objetivoValue ? { value: objetivoValue, label: objetivoValue } : null}
              onChange={(opt) => setValue('objetivo', String(opt?.value))}
              placeholder="Selecione..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Nível</label>
            <Select 
              options={NIVEIS}
              value={nivelValue ? { value: nivelValue, label: nivelValue } : null}
              onChange={(opt) => setValue('nivel', String(opt?.value))}
              placeholder="Selecione..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={isPending}>Cadastrar Aluno</Button>
        </div>
      </form>
    </Modal>
  )
}
