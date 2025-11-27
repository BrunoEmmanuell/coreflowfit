// src/components/NewAlunoModal.tsx
import React, { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Select, { Option } from '@/components/ui/Select'
import api from '@/services/api'
import { cn } from '@/utils/cn'

type Medidas = {
  peso?: number
  altura?: number
  ombros?: number
  peito?: number
  cintura?: number
  quadril?: number
  braco?: number
  coxa?: number
  panturrilha?: number
}

type Saude = {
  hipertensao?: boolean
  diabetes?: boolean
  cardiopatia?: boolean
  lesoes?: string
  medicacao?: string
}

export type NewAlunoPayload = {
  nome: string
  idade?: number
  sexo?: 'masculino' | 'feminino' | 'outro'
  objetivo?: string
  nivel?: string
  medidas?: Medidas
  saude?: Saude
  fotoUrl?: string
}

type Props = {
  open: boolean
  onClose: () => void
  // opcional: callback que será chamado quando o aluno for criado com retorno do backend
  onCreated?: (data: any) => void
}

const sexoOptions: Option[] = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
]

const nivelOptions: Option[] = [
  { value: 'Iniciante', label: 'Iniciante' },
  { value: 'Intermediário', label: 'Intermediário' },
  { value: 'Avançado', label: 'Avançado' },
]

export default function NewAlunoModal({ open, onClose, onCreated }: Props) {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<number>(0)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
    reset,
  } = useForm<NewAlunoPayload>({
    mode: 'onChange',
    defaultValues: {
      nome: '',
      idade: undefined,
      sexo: 'masculino',
      objetivo: '',
      nivel: 'Iniciante',
      medidas: {},
      saude: {},
      fotoUrl: '',
    },
  })

  useEffect(() => {
    if (!open) {
      // reset quando modal fecha
      reset()
      setActiveTab(0)
      setServerError(null)
    }
  }, [open, reset])

  const createAluno = useMutation(
    async (payload: NewAlunoPayload) => {
      const { data } = await api.post('/api/v1/alunos/completo', payload)
      return data
    },
    {
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: ['alunos'] })
        onCreated?.(data)
        onClose()
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Erro ao criar aluno'
        setServerError(String(msg))
      },
    }
  )

  const onSubmit = (values: NewAlunoPayload) => {
    setServerError(null)
    // validação extra: nome obrigatório (react-hook-form já lida, mas reforçar)
    createAluno.mutate(values)
  }

  // small helper to show required star
  const Req = () => <span className="text-rose-600 ml-1">*</span>

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo aluno"
      size="lg"
      closeOnBackdrop
      ariaLabel="Modal para criar novo aluno"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            loading={createAluno.isLoading}
            onClick={() => void handleSubmit(onSubmit)()}
          >
            {createAluno.isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <Alert type="error" title="Erro" description={serverError} dismissible onDismiss={() => setServerError(null)} />}

        {/* Tabs */}
        <div>
          <div role="tablist" aria-label="Seções do formulário" className="flex gap-2 mb-4">
            {['Dados Pessoais', 'Medidas', 'Saúde'].map((t, idx) => (
              <button
                key={t}
                role="tab"
                aria-selected={activeTab === idx}
                onClick={() => setActiveTab(idx)}
                type="button"
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium',
                  activeTab === idx ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <div>
            {/* Tab 0: Dados Pessoais */}
            <div hidden={activeTab !== 0} aria-hidden={activeTab !== 0}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label={
                    <span>
                      Nome <Req />
                    </span>
                  }
                  placeholder="Nome completo"
                  {...register('nome', { required: 'Nome é obrigatório', minLength: { value: 2, message: 'Nome muito curto' } })}
                  error={errors.nome?.message}
                />

                <Input
                  label="Idade"
                  type="number"
                  placeholder="Idade"
                  {...register('idade', { valueAsNumber: true })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Sexo</label>
                  <Controller
                    control={control}
                    name="sexo"
                    render={({ field }) => (
                      <Select
                        options={sexoOptions}
                        value={sexoOptions.find((o) => o.value === field.value) ?? null}
                        onChange={(opt) => field.onChange(opt?.value)}
                        placeholder="Sexo"
                        searchable={false}
                        clearable={false}
                        className="mt-1"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Objetivo <Req />
                  </label>
                  <Input
                    placeholder="Ex: Hipertrofia"
                    className="mt-1"
                    {...register('objetivo', { required: 'Objetivo é obrigatório' })}
                    error={errors.objetivo?.message}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Nível</label>
                  <Controller
                    control={control}
                    name="nivel"
                    render={({ field }) => (
                      <Select
                        options={nivelOptions}
                        value={nivelOptions.find((o) => o.value === field.value) ?? null}
                        onChange={(opt) => field.onChange(opt?.value)}
                        searchable={false}
                        clearable={false}
                        className="mt-1"
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Tab 1: Medidas */}
            <div hidden={activeTab !== 1} aria-hidden={activeTab !== 1}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Peso (kg)" type="number" step="0.1" {...register('medidas.peso', { valueAsNumber: true })} />
                <Input label="Altura (m)" type="number" step="0.01" {...register('medidas.altura', { valueAsNumber: true })} />
                <Input label="Ombros (cm)" type="number" step="0.1" {...register('medidas.ombros', { valueAsNumber: true })} />
                <Input label="Peito (cm)" type="number" step="0.1" {...register('medidas.peito', { valueAsNumber: true })} />
                <Input label="Cintura (cm)" type="number" step="0.1" {...register('medidas.cintura', { valueAsNumber: true })} />
                <Input label="Quadril (cm)" type="number" step="0.1" {...register('medidas.quadril', { valueAsNumber: true })} />
                <Input label="Braço (cm)" type="number" step="0.1" {...register('medidas.braco', { valueAsNumber: true })} />
                <Input label="Coxa (cm)" type="number" step="0.1" {...register('medidas.coxa', { valueAsNumber: true })} />
                <Input label="Panturrilha (cm)" type="number" step="0.1" {...register('medidas.panturrilha', { valueAsNumber: true })} />
              </div>
            </div>

            {/* Tab 2: Saúde */}
            <div hidden={activeTab !== 2} aria-hidden={activeTab !== 2}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="form-checkbox" {...register('saude.hipertensao')} />
                    <span className="text-sm">Hipertensão</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="form-checkbox" {...register('saude.diabetes')} />
                    <span className="text-sm">Diabetes</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="form-checkbox" {...register('saude.cardiopatia')} />
                    <span className="text-sm">Cardiopatia</span>
                  </label>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3">
                <label className="text-sm font-medium text-slate-700">Lesões (descreva)</label>
                <textarea
                  {...register('saude.lesoes')}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm"
                  placeholder="Ex: Lesão no joelho em 2022..."
                />

                <label className="text-sm font-medium text-slate-700">Medicação (descreva)</label>
                <textarea
                  {...register('saude.medicacao')}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm"
                  placeholder="Ex: Uso de anti-hipertensivo..."
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}
