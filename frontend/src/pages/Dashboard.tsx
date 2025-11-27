// src/pages/Dashboard.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '@/components/layout/Layout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import StudentsGrid, { Aluno as AlunoType } from '@/components/StudentsGrid'
import NewAlunoModal from '@/components/NewAlunoModal'
import api from '@/services/api'
import { useAlunos } from '@/hooks/useAlunos' // se usa AlunosContext, troque pelo hook equivalente

export default function DashboardPage(): JSX.Element {
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Hook que busca /api/v1/alunos/ - deve retornar array ou undefined
  const { data: alunosData, isLoading: alunosLoading, refetch: refetchAlunos } = useAlunos()
  const alunos: AlunoType[] = alunosData ?? []

  // UI state
  const [query, setQuery] = useState<string>('')
  const [debouncedQuery, setDebouncedQuery] = useState<string>(query)
  const [openNew, setOpenNew] = useState<boolean>(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiSuccess, setApiSuccess] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  // debounce simple (200ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 200)
    return () => clearTimeout(t)
  }, [query])

  // client-side filter by nome (case-insensitive)
  const filtered = useMemo(() => {
    if (!debouncedQuery) return alunos
    return alunos.filter((a) => ((a.nome ?? a.name ?? '') as string).toLowerCase().includes(debouncedQuery.toLowerCase()))
  }, [alunos, debouncedQuery])

  // create aluno mutation (in case you want to create from here as well)
  const createAluno = useMutation(
    async (payload: any) => {
      const { data } = await api.post('/api/v1/alunos/completo', payload)
      return data
    },
    {
      onSuccess: (data) => {
        setApiSuccess('Aluno criado com sucesso.')
        setApiError(null)
        setOpenNew(false)
        qc.invalidateQueries({ queryKey: ['alunos'] })
        // if API returns id, navigate to profile
        const id = data?.id ?? data?.aluno?.id
        if (id) navigate(`/alunos/${id}`)
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Erro ao criar aluno'
        setApiError(String(msg))
      },
    }
  )

  // gerar treino mutation
  const gerarTreino = useMutation(
    async (payload: { aluno_id: string }) => {
      const { data } = await api.post('/api/v1/treinos/gerar', payload)
      return data
    },
    {
      onMutate: (vars) => {
        setGeneratingId(vars.aluno_id)
        setApiError(null)
        setApiSuccess(null)
      },
      onSuccess: (data) => {
        setGeneratingId(null)
        setApiSuccess('Treino gerado com sucesso.')
        qc.invalidateQueries({ queryKey: ['treinos'] })
        qc.invalidateQueries({ queryKey: ['alunos'] })
        const treinoId = data?.id ?? data?.treino?.id
        if (treinoId) navigate(`/treino/${treinoId}`)
      },
      onError: (err: any) => {
        setGeneratingId(null)
        const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Erro ao gerar treino'
        setApiError(String(msg))
      },
    }
  )

  // handlers passed to StudentsGrid
  const handleViewProfile = useCallback((id: string) => {
    navigate(`/alunos/${id}`)
  }, [navigate])

  const handleGenerateTreino = useCallback((id: string) => {
    // optional confirmation
    // if you prefer a modal with options, replace confirm with a modal
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Gerar treino personalizado com IA para este aluno?')) return
    gerarTreino.mutate({ aluno_id: id })
  }, [gerarTreino])

  const handleAddFirst = useCallback(() => {
    setOpenNew(true)
  }, [])

  // pass-through when NewAlunoModal calls onCreated
  const handleAlunoCreated = useCallback((data: any) => {
    qc.invalidateQueries({ queryKey: ['alunos'] })
    const id = data?.id ?? data?.aluno?.id
    if (id) {
      // small delay to give user feedback, then navigate
      setTimeout(() => navigate(`/alunos/${id}`), 400)
    }
  }, [qc, navigate])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Meus Alunos</h1>
          <p className="text-sm text-slate-500">Gerencie seus alunos e acompanhe o progresso</p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Buscar por nome"
            value={query}
            onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
            leftIcon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
            }
            className="w-64"
          />
          <Button variant="primary" size="md" onClick={() => { setOpenNew(true); setApiError(null); setApiSuccess(null) }}>
            Novo Aluno
          </Button>
        </div>
      </div>

      {apiError && (
        <div className="mb-4">
          <Alert type="error" title="Erro" description={apiError} dismissible onDismiss={() => setApiError(null)} />
        </div>
      )}

      {apiSuccess && (
        <div className="mb-4">
          <Alert type="success" title="Sucesso" description={apiSuccess} dismissible onDismiss={() => setApiSuccess(null)} />
        </div>
      )}

      <StudentsGrid
        students={filtered}
        loading={alunosLoading}
        onViewProfile={handleViewProfile}
        onGenerateTreino={handleGenerateTreino}
        onAddFirst={handleAddFirst}
      />

      {/* New Aluno Modal (com abas: Dados Pessoais / Medidas / Saúde) */}
      <NewAlunoModal open={openNew} onClose={() => setOpenNew(false)} onCreated={handleAlunoCreated} />
    </Layout>
  )
}
