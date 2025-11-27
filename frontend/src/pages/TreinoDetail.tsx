// src/pages/TreinoDetail.tsx
import React, { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import Layout from '@/components/layout/Layout'
import Card, { CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Alert from '@/components/ui/Alert'
import api from '@/services/api'

type Exercicio = {
  id?: string
  nome: string
  series?: string | number
  repeticoes?: string
  descanso?: string
  tecnica?: string | null
  observacoes?: string | null
  grupoMuscular?: string | null
}

type Dia = {
  titulo: string // ex "Dia A"
  exercicios: Exercicio[]
}

type Treino = {
  id: string
  nome?: string
  data_geracao?: string
  divisao?: string
  dias?: Dia[]
  aluno_id?: string | null
  observacoes?: string | null
  [k: string]: any
}

/** small helper: return simple icon per muscle group (svg strings/components) */
function MuscleIcon({ group }: { group?: string | null }) {
  const base = 'w-5 h-5'
  const g = (group || '').toLowerCase()
  if (g.includes('peito')) {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M3 12s4-7 9-7 9 7 9 7-4 7-9 7S3 12 3 12z" />
      </svg>
    )
  }
  if (g.includes('costas') || g.includes('dorsal')) {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 18h16M4 6v12M20 6v12" />
      </svg>
    )
  }
  if (g.includes('perna') || g.includes('cox') || g.includes('panturr')) {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M12 2v6M8 22v-6M16 22v-6M3 12h18" />
      </svg>
    )
  }
  if (g.includes('ombro') || g.includes('trap')) {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <circle cx="12" cy="7" r="3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M5 21c1.5-4 9-4 14 0" />
      </svg>
    )
  }
  if (g.includes('braço') || g.includes('tríceps') || g.includes('bíceps')) {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M12 2v6M12 22v-6M5 7l14 10" />
      </svg>
    )
  }

  // default generic icon
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function TreinoDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0)
  const [regenModalOpen, setRegenModalOpen] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiSuccess, setApiSuccess] = useState<string | null>(null)

  // fetch treino
  const { data: treino, isLoading, isError } = useQuery<Treino>(
    ['treino', id],
    async () => {
      const { data } = await api.get(`/api/v1/treinos/${id}`)
      return data
    },
    { enabled: !!id }
  )

  // mutation to generate a new treino (optionally using aluno_id or same params)
  const generateMutation = useMutation(
    async (payload: { aluno_id?: string | null }) => {
      const { data } = await api.post('/api/v1/treinos/gerar', payload)
      return data
    },
    {
      onMutate: () => {
        setApiError(null)
        setApiSuccess(null)
      },
      onSuccess: (data) => {
        setApiSuccess('Treino gerado com sucesso.')
        qc.invalidateQueries({ queryKey: ['treinos'] })
        qc.invalidateQueries({ queryKey: ['treino', id] })
        // if new treino id returned, navigate to it
        const newId = data?.id ?? data?.treino?.id
        if (newId) navigate(`/treino/${newId}`)
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Erro ao gerar treino'
        setApiError(String(msg))
      },
    }
  )

  // derived values
  const days = useMemo(() => treino?.dias ?? [], [treino])
  const activeDay = days && days.length > 0 ? days[selectedDayIndex] ?? days[0] : undefined

  if (isLoading) {
    return (
      <Layout>
        <div className="py-24 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
            <div className="text-sm text-slate-500">Carregando treino...</div>
          </div>
        </div>
      </Layout>
    )
  }

  if (isError || !treino) {
    return (
      <Layout>
        <div className="py-20">
          <Alert type="error" title="Erro" description="Não foi possível carregar o treino." dismissible onDismiss={() => setApiError(null)} />
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{treino.nome ?? `Treino ${treino.id}`}</h1>
              <div className="text-sm text-slate-500">Gerado em: {treino.data_geracao ? new Date(treino.data_geracao).toLocaleString() : '—'}</div>
              {treino.divisao && <Badge variant="neutral" className="ml-2">{treino.divisao}</Badge>}
            </div>
            {treino.observacoes && <div className="mt-2 text-sm text-slate-500">{treino.observacoes}</div>}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={() => window.print()}>Imprimir</Button>
            <Button variant="primary" size="md" onClick={() => setRegenModalOpen(true)}>Gerar Novo Treino</Button>
          </div>
        </div>

        {/* Tabs per day */}
        <div>
          <div className="flex gap-2 mb-4 overflow-auto">
            {days.length === 0 ? (
              <div className="text-sm text-slate-500">Nenhum dia definido neste treino.</div>
            ) : (
              days.map((d: Dia, idx: number) => (
                <button
                  key={d.titulo ?? idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${selectedDayIndex === idx ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {d.titulo ?? `Dia ${idx + 1}`}
                </button>
              ))
            )}
          </div>

          {/* Day content */}
          <div>
            {activeDay ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeDay.exercicios.map((ex, i) => (
                  <Card key={ex.id ?? `${i}-${ex.nome}`} variant="default">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                            <MuscleIcon group={ex.grupoMuscular} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{ex.nome}</div>
                            <div className="text-xs text-slate-500 truncate">{ex.tecnica ?? ''}</div>
                          </div>
                        </div>

                        <div className="text-sm text-slate-500">
                          {ex.series ?? '—'} x {ex.repeticoes ?? '—'}
                        </div>
                      </div>
                    </CardHeader>

                    <CardBody>
                      <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
                        <div><span className="font-medium text-slate-600">Descanso:</span> {ex.descanso ?? '—'}</div>
                        {ex.observacoes && <div><span className="font-medium text-slate-600">Observações:</span> {ex.observacoes}</div>}
                        {ex.tecnica && <div><span className="font-medium text-slate-600">Técnica:</span> {ex.tecnica}</div>}
                      </div>
                    </CardBody>

                    <CardFooter>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500">Grupo: {ex.grupoMuscular ?? '—'}</div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/exercicios/${ex.id ?? ''}`)}>Ver exercício</Button>
                          <Button variant="secondary" size="sm" onClick={() => alert('Marcar como realizado — recurso a implementar')}>Marcar realizado</Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">Nenhum exercício encontrado para este dia.</div>
            )}
          </div>
        </div>

        {/* Regenerate confirmation modal */}
        <Modal
          open={regenModalOpen}
          onClose={() => setRegenModalOpen(false)}
          title="Gerar novo treino"
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRegenModalOpen(false)}>Cancelar</Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  // prefer to use aluno_id if available
                  generateMutation.mutate({ aluno_id: treino.aluno_id ?? null })
                }}
              >
                Gerar
              </Button>
            </div>
          }
        >
          <div className="text-sm text-slate-600">
            Deseja gerar um novo treino para este aluno? O treino antigo permanecerá salvo. Você pode ajustar parâmetros no backend (intensidade, duração) se disponível.
          </div>
        </Modal>
      </div>
    </Layout>
  )
}
