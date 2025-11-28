// @ts-nocheck
// src/pages/TreinosHistory.tsx
import React, { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import Layout from '@/components/layout/Layout'
import Card, { CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'

type Treino = {
  id: string
  data?: string
  divisao?: string
  titulo?: string
  observacoes?: string
  [k: string]: any
}

export default function TreinosHistoryPage(): JSX.Element {
  const { id: alunoId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [from, setFrom] = useState<string>('') // yyyy-mm-dd
  const [to, setTo] = useState<string>('')
  const [division, setDivision] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiSuccess, setApiSuccess] = useState<string | null>(null)

  // fetch treinos do aluno
  const { data: treinos, isLoading } = useQuery<Treino[]>(
    ['treinos', alunoId],
    async () => {
      const { data } = await api.get(`/api/v1/treinos/aluno/${alunoId}`)
      // assegura array
      return Array.isArray(data) ? data : (data?.treinos ?? [])
    },
    { enabled: !!alunoId }
  )

  // derive divisions options
  const divisions = useMemo(() => {
    if (!treinos) return []
    const set = new Set<string>()
    (treinos as any[]).forEach((t) => {
      if (t.divisao) set.add(String(t.divisao))
    })
    return Array.from(set).map((d) => ({ value: d, label: d }))
  }, [treinos])

  // client-side filter
  const filtered = useMemo(() => {
    if (!treinos) return []
    return (treinos as any[]).filter((t) => {
      // division filter
      if (division && String(t.divisao) !== division) return false
      // date filter
      if (from) {
        const fromDate = new Date(from)
        const tDate = t.data ? new Date(t.data) : null
        if (!tDate || tDate < fromDate) return false
      }
      if (to) {
        const toDate = new Date(to)
        const tDate = t.data ? new Date(t.data) : null
        if (!tDate || tDate > toDate) return false
      }
      return true
    })
  }, [treinos, from, to, division])

  // mutation: duplicar / gerar novo treino baseado no existente
  const duplicate = (useMutation as any)(
    async (baseTreinoId: string) => {
      // payload: tente enviar base_treino_id (backend pode suportar ou nÃ£o)
      // se nÃ£o suportar, fallback no servidor para gerar com aluno_id apenas
      const payload = { aluno_id: alunoId, base_treino_id: baseTreinoId }
      const { data } = await api.post('/api/v1/treinos/gerar', payload)
      return data
    },
    {
      onMutate: () => {
        setApiError(null)
        setApiSuccess(null)
      },
      onSuccess: (data:any) => {
        setApiSuccess('Treino duplicado/gerado com sucesso.')
        qc.invalidateQueries({ queryKey: ['treinos', alunoId] })
        // navegar para o novo treino se API retornar id
        const newId = data?.id ?? data?.treino?.id
        if (newId) navigate(`/treino/${newId}`)
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Erro ao duplicar treino'
        setApiError(String(msg))
      },
    }
  )

  const handleDuplicate = (treinoId: string) => {
    if (!confirm('Duplicar este treino? SerÃ¡ gerado um novo treino baseado neste.')) return
    (duplicate as any).mutate(treinoId as any)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">HistÃ³rico de Treinos</h1>
            <p className="text-sm text-slate-500">Filtre e veja treinos anteriores deste aluno</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">De</label>
              <Input type="date" value={from} onChange={(e) => setFrom((e.target as HTMLInputElement).value)} />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">AtÃ©</label>
              <Input type="date" value={to} onChange={(e) => setTo((e.target as HTMLInputElement).value)} />
            </div>

            <div className="w-56">
              <Select
                options={[{ value: '', label: 'Todas as divisÃµes' }, ...divisions]}
                value={division ? { value: division, label: division } : null}
                onChange={(opt) => setDivision(opt?.value ? String(opt.value) : null)}
                placeholder="Filtrar por divisÃ£o"
                searchable={false}
                clearable
              />
            </div>
          </div>
        </div>

        {apiError && <Alert type="error" title="Erro" description={apiError} dismissible onDismiss={() => setApiError(null)} />}
        {apiSuccess && <Alert type="success" title="Sucesso" description={apiSuccess} dismissible onDismiss={() => setApiSuccess(null)} />}

        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
              <div className="text-sm text-slate-500">Carregando histÃ³rico...</div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-6">
            <div className="w-48 h-48 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg flex items-center justify-center">
              {/* ilustraÃ§Ã£o simples */}
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="120" height="120" rx="12" fill="#fff" />
                <path d="M30 88c4-10 12-18 24-18s20 8 24 18" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="60" cy="40" r="18" stroke="#CBD5E1" strokeWidth="3" />
              </svg>
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-semibold">Nenhum treino encontrado</h3>
              <p className="text-sm text-slate-500 mt-2">Aplique outros filtros ou gere um novo treino para este aluno.</p>
            </div>
            <div>
              <Button variant="primary" onClick={() => navigate(`/dashboard`)}>Adicionar / Gerar Treino</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <Card key={t.id} variant="elevated">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{t.titulo ?? `Treino ${t.id}`}</div>
                      <div className="text-xs text-slate-500">{t.data ? new Date(t.data).toLocaleDateString() : 'â€”'}</div>
                    </div>
                    <div className="text-xs">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{t.divisao ?? 'â€”'}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardBody>
                  <div className="text-sm text-slate-700 mb-2">{t.observacoes ?? 'Sem observaÃ§Ãµes'}</div>
                  {/* opÃ§Ãµes de resumo adicional se houver */}
                  <div className="text-xs text-slate-500">
                    {/* por exemplo: nÃºmero de exercÃ­cios, duraÃ§Ã£o, etc (adapte caso seu backend retorne) */}
                    {Array.isArray(t.dias) ? `${t.dias.length} dias â€¢ ${t.dias.reduce((acc:any, d:any) => acc + (d.exercicios?.length ?? 0), 0)} exercÃ­cios` : null}
                  </div>
                </CardBody>

                <CardFooter>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/treino/${t.id}`)}>Ver Detalhes</Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" loading={(duplicate as any).isLoading && (duplicate as any).variables === t.id} onClick={() => handleDuplicate(t.id)}>Duplicar</Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}




