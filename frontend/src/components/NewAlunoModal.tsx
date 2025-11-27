// src/components/NewAlunoModal.tsx
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import api from '@/services/api'
import { useAlunosContext } from '@/contexts/AlunosContext'
import Modal from '@/components/ui/Modal' // se não existir, o modal abaixo usa markup simples

const DadosSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  idade: z.number().min(1).optional(),
  sexo: z.enum(['M', 'F']).optional(),
  objetivo: z.string().optional(),
  nivel: z.string().optional(),
})

const MedidasSchema = z.object({
  peso: z.number().optional(),
  altura: z.number().optional(),
  cintura: z.number().optional(),
  quadril: z.number().optional(),
})

const SaudeSchema = z.object({
  hipertensao: z.boolean().optional(),
  diabetes: z.boolean().optional(),
  cardiopatia: z.boolean().optional(),
  lesoes: z.string().optional(),
  medicacao: z.string().optional(),
})

type DadosForm = z.infer<typeof DadosSchema>
type MedidasForm = z.infer<typeof MedidasSchema>
type SaudeForm = z.infer<typeof SaudeSchema>

export default function NewAlunoModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (data: any) => void }) {
  const [tab, setTab] = useState<'dados' | 'medidas' | 'saude'>('dados')
  const { createAluno } = useAlunosContext()
  const { register, handleSubmit, reset } = useForm<DadosForm>({ resolver: zodResolver(DadosSchema) })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (vals: any) => {
    setLoading(true)
    setError(null)
    try {
      // montar payload combinando abas — para simplicidade usamos apenas dados básicos aqui
      const payload = {
        nome: vals.nome,
        idade: vals.idade,
        sexo: vals.sexo,
        medidas: {
          peso: vals.peso,
          altura: vals.altura,
        },
        saude: {
          lesoes: vals.lesoes,
          medicacao: vals.medicacao,
        },
      }
      const res = await createAluno(payload)
      onCreated?.(res)
      reset()
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Erro ao criar aluno')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Novo Aluno">
      <div className="flex gap-4">
        <aside className="w-40">
          <nav className="flex flex-col gap-2">
            <button className={tab === 'dados' ? 'font-medium' : ''} onClick={() => setTab('dados')}>Dados Pessoais</button>
            <button className={tab === 'medidas' ? 'font-medium' : ''} onClick={() => setTab('medidas')}>Medidas</button>
            <button className={tab === 'saude' ? 'font-medium' : ''} onClick={() => setTab('saude')}>Saúde</button>
          </nav>
        </aside>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-4">
          {error && <div className="text-red-600">{error}</div>}

          {tab === 'dados' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Nome" {...register('nome' as any)} />
              <Input label="Idade" type="number" {...register('idade' as any)} />
              <Input label="Sexo (M/F)" {...register('sexo' as any)} />
              <Input label="Objetivo" {...register('objetivo' as any)} />
              <Input label="Nível" {...register('nivel' as any)} />
            </div>
          )}

          {tab === 'medidas' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Peso (kg)" type="number" {...register('peso' as any)} />
              <Input label="Altura (cm)" type="number" {...register('altura' as any)} />
              <Input label="Cintura (cm)" type="number" {...register('cintura' as any)} />
              <Input label="Quadril (cm)" type="number" {...register('quadril' as any)} />
            </div>
          )}

          {tab === 'saude' && (
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('hipertensao' as any)} /> Hipertensão
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('diabetes' as any)} /> Diabetes
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('cardiopatia' as any)} /> Cardiopatia
              </label>

              <Input label="Lesões (descrição)" {...register('lesoes' as any)} />
              <Input label="Medicação" {...register('medicacao' as any)} />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" loading={loading} variant="primary">Salvar</Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
