// src/pages/AlunoProfile.tsx
import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

import Layout from '@/components/layout/Layout'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import Alert from '@/components/ui/Alert'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import KPICard from '@/components/ui/KPICard'
import api from '@/services/api'
import { useForm } from 'react-hook-form'

type Medida = {
  data?: string
  peso?: number
  altura?: number
  [k: string]: any
}

type Treino = {
  id: string
  data?: string
  divisao?: string
  titulo?: string
  [k: string]: any
}

type AlunoProfilePayload = {
  id: string
  nome?: string
  objetivo?: string
  nivel?: string
  fotoUrl?: string | null
  medidas?: Medida[]
  treinos?: Treino[]
  total_treinos?: number
  // outros campos possíveis...
  [k: string]: any
}

export default function AlunoProfilePage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [apiError, setApiError] = useState<string | null>(null)
  const [apiSuccess, setApiSuccess] = useState<string | null>(null)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false)
  const [generating, setGenerating] = useState(false)

  // --- fetch aluno profile (includes medidas & treinos if backend returns them) ---
  const { data: aluno, isLoading, isError } = useQuery<AlunoProfilePayload>(
    ['aluno', id],
    async () => {
      const { data } = await api.get(`/api/v1/alunos/${id}`)
      return data
    },
    { enabled: !!id }
  )

  // alternatively, if medidas and treinos are separate endpoints we fetch them too:
  const { data: medidas } = useQuery<Medida[]>(
    ['medidas', id],
    async () => {
      const { data } = await api.get(`/api/v1/medidas/${id}`)
      return data
    },
    { enabled: !!id, refetchOnWindowFocus: false }
  )

  const { data: treinos } = useQuery<Treino[]>(
    ['treinos', id],
    async () => {
      const { data } = await api.get(`/api/v1/treinos/aluno/${id}`)
      return data
    },
    { enabled: !!id, refetchOnWindowFocus: false }
  )

  // --- mutation: delete aluno ---
  const deleteAluno = useMutation(
    async (alunoId: string) => {
      await api.delete(`/api/v1/alunos/${alunoId}`)
    },
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['alunos'] })
        setApiSuccess('Aluno excluído com sucesso.')
        navigate('/dashboard')
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Erro ao excluir aluno'
        setApiError(String(msg))
      },
    }
  )

  // --- mutation: gerar treino (POST /api/v1/treinos/gerar) ---
  const gerarTreino = useMutation(
    async (payload: { aluno_id: string }) => {
      const { data } = await api.post('/api/v1/treinos/gerar', payload)
      return data
    },
    {
      onMutate: () => {
        setGenerating(true)
        setApiError(null)
        setApiSuccess(null)
      },
      onSuccess: (data) => {
        setGenerating(false)
        setApiSuccess('Treino gerado com sucesso.')
        qc.invalidateQueries({ queryKey: ['treinos', id] })
        // navegar para detalhe se API retornar id do treino
        const treinoId = data?.id ?? data?.treino?.id
        if (treinoId) navigate(`/treinos/${treinoId}`)
      },
      onError: (err: any) => {
        setGenerating(false)
        const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Erro ao gerar treino'
        setApiError(String(msg))
      },
    }
  )

  // --- edit form (simple) ---
  const { register, handleSubmit, formState: { errors, isValid }, reset } = useForm<any>({
    mode: 'onChange',
    defaultValues: {
      nome: aluno?.nome ?? '',
      objetivo: aluno?.objetivo ?? '',
      nivel: aluno?.nivel ?? '',
      fotoUrl: aluno?.fotoUrl ?? '',
    }
  })

  // reset form when aluno loads or modal opens
  React.useEffect(() => {
    if (aluno) {
      reset({ nome: aluno.nome ?? '', objetivo: aluno.objetivo ?? '', nivel: aluno.nivel ?? '', fotoUrl: aluno.fotoUrl ?? '' })
    }
  }, [aluno, reset, openEdit])

  // --- mutation: update aluno (assume PUT /api/v1/alunos/{id}) ---
  const updateAluno = useMutation(
    async ({ alunoId, payload }: { alunoId: string; payload: any }) => {
      // ADAPTE AQUI se seu backend usar outro método/rota
      const { data } = await api.put(`/api/v1/alunos/${alunoId}`, payload)
      return data
    },
    {
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: ['aluno', id] })
        qc.invalidateQueries({ queryKey: ['alunos'] })
        setApiSuccess('Aluno atualizado com sucesso.')
        setOpenEdit(false)
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Erro ao atualizar'
        setApiError(String(msg))
      },
    }
  )

  // --- compute KPIs ---
  const totalTreinos = aluno?.total_treinos ?? (Array.isArray(treinos) ? treinos.length : 0)
  const latestMedida = (medidas && medidas.length > 0) ? medidas.slice().sort((a,b) => (new Date(b.data).getTime() - new Date(a.data).getTime()))[0] : undefined
  const latestPeso = latestMedida?.peso ?? aluno?.medidas?.[0]?.peso ?? null
  const latestAltura = latestMedida?.altura ?? aluno?.medidas?.[0]?.altura ?? null
  const imc = latestPeso && latestAltura ? Number((latestPeso / (latestAltura * latestAltura)).toFixed(1)) : null

  // prepare chart data for weight evolution (assume medidas array has { data, peso })
  const chartData = useMemo(() => {
    const src = medidas ?? aluno?.medidas ?? []
    if (!src || src.length === 0) return []
    // map to { date: 'DD/MM', peso }
    return src
      .slice()
      .sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .map((m) => ({ date: m.data ? new Date(m.data).toLocaleDateString() : '', peso: m.peso ?? null }))
  }, [medidas, aluno])

  // recent treinos (last 5)
  const recentTreinos = (treinos ?? alumnoFallbackTreinos(aluno)).slice ? (treinos ?? alumnoFallbackTreinos(aluno)).slice(0,5) : []

  function alumnoFallbackTreinos(alunoObj: any): Treino[] {
    // if aluno contains treinos embedded
    if (!alunoObj) return []
    if (Array.isArray(alunoObj.treinos)) return alunoObj.treinos
    return []
  }

  // handlers
  const handleDelete = () => {
    deleteAluno.mutate(id!)
  }

  const handleGenerate = () => {
    if (!id) return
    if (!confirm('Confirmar geração de treino para este aluno?')) return
    gerarTreino.mutate({ aluno_id: id })
  }

  const onSubmitEdit = (values: any) => {
    if (!id) return
    const payload = {
      nome: values.nome,
      objetivo: values.objetivo,
      nivel: values.nivel,
      fotoUrl: values.fotoUrl,
    }
    updateAluno.mutate({ alunoId: id, payload })
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="py-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
            <div className="text-sm text-slate-500">Carregando perfil...</div>
          </div>
        </div>
      </Layout>
    )
  }

  if (isError || !aluno) {
    return (
      <Layout>
        <div className="py-20">
          <Alert type="error" title="Erro" description="Não foi possível carregar o perfil do aluno." dismissible onDismiss={() => setApiError(null)} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {apiError && <Alert type="error" title="Erro" description={apiError} dismissible onDismiss={() => setApiError(null)} />}
        {apiSuccess && <Alert type="success" title="Sucesso" description={apiSuccess} dismissible onDismiss={() => setApiSuccess(null)} />}

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-xl font-semibold">
              {aluno.fotoUrl ? <img src={aluno.fotoUrl} alt={aluno.nome} className="w-full h-full object-cover" /> : (aluno.nome ?? '—').split(' ').map((s:any)=>s[0]).slice(0,2).join('')}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">{aluno.nome ?? '—'}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{aluno.objetivo ?? '—'}</Badge>
                  <Badge variant="neutral">{aluno.nivel ?? '—'}</Badge>
                </div>
              </div>
              <div className="text-sm text-slate-500 mt-1">Perfil do aluno — acompanhe progresso e treinos</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={() => setOpenEdit(true)}>Editar</Button>
            <Button variant="primary" size="md" loading={generating} onClick={handleGenerate}>Gerar Treino</Button>
            <Button variant="danger" size="md" onClick={() => setOpenDeleteConfirm(true)}>Excluir</Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPICard title="Total de treinos" value={totalTreinos ?? 0} subtitle="Total gerado" />
          <Card variant="default">
            <CardHeader>Última Medida</CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-slate-500">Peso</div>
                  <div className="text-lg font-medium">{latestPeso ? `${latestPeso} kg` : '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Altura</div>
                  <div className="text-lg font-medium">{latestAltura ? `${latestAltura} m` : '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">IMC</div>
                  <div className="text-lg font-medium">{imc ?? '—'}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card variant="default">
            <CardHeader>Próximo Treino</CardHeader>
            <CardBody>
              {recentTreinos && recentTreinos.length > 0 ? (
                <div>
                  <div className="text-sm text-slate-500">Próximo</div>
                  <div className="text-lg font-medium">{recentTreinos[0].titulo ?? recentTreinos[0].divisao ?? '—'}</div>
                  <div className="text-xs text-slate-500 mt-1">{recentTreinos[0].data ?? ''}</div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">Nenhum treino agendado</div>
              )}
            </CardBody>
            <CardFooter>
              <div className="flex items-center justify-end">
                <Button variant="ghost" size="sm" onClick={() => navigate('/treinos')}>Ver todos</Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Recent Workouts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card variant="elevated">
            <CardHeader>Treinos Recentes</CardHeader>
            <CardBody>
              {(!treinos || treinos.length === 0) ? (
                <div className="text-sm text-slate-500">Nenhum treino encontrado</div>
              ) : (
                <ul className="space-y-3">
                  {(treinos.slice(0,5)).map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded">
                      <div>
                        <div className="text-sm font-medium">{t.titulo ?? (t.divisao ? `Divisão ${t.divisao}` : 'Treino')}</div>
                        <div className="text-xs text-slate-500">{t.data ?? ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/treinos/${t.id}`)}>Ver Detalhes</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card variant="elevated">
            <CardHeader>Evolução de Peso</CardHeader>
            <CardBody>
              {chartData.length === 0 ? (
                <div className="text-sm text-slate-500">Sem dados de peso</div>
              ) : (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E6E9EF" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="peso" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Editar Aluno" size="md" footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpenEdit(false)}>Cancelar</Button>
          <Button variant="primary" size="md" loading={updateAluno.isLoading} onClick={() => void handleSubmit(onSubmitEdit)()}>
            {updateAluno.isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      }>
        <form className="space-y-3">
          <Input label="Nome" {...register('nome', { required: true })} error={errors.nome && 'Nome obrigatório'} />
          <Input label="Objetivo" {...register('objetivo')} />
          <Input label="Nível" {...register('nivel')} />
          <Input label="URL da foto" {...register('fotoUrl')} />
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} title="Confirmar exclusão" size="sm" footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpenDeleteConfirm(false)}>Cancelar</Button>
          <Button variant="danger" size="md" loading={deleteAluno.isLoading} onClick={handleDelete}>Excluir</Button>
        </div>
      }>
        <div className="py-2">
          <p>Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.</p>
        </div>
      </Modal>
    </Layout>
  )
}
