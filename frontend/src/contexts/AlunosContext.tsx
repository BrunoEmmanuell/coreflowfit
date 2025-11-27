// src/contexts/AlunosContext.tsx
import React, { createContext, useContext, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

export type Aluno = {
  id: string
  nome?: string
  objetivo?: string
  nivel?: string
  peso?: number
  altura?: number
  fotoUrl?: string | null
  [k: string]: any
}

type AlunosContextValue = {
  alunos: Aluno[]
  loading: boolean
  error: unknown
  refresh: () => Promise<void>
  selectAluno: (a: Aluno | null) => void
  selectedAluno: Aluno | null
  createAluno: (payload: any) => Promise<any>
  deleteAluno: (id: string) => Promise<void>
}

const AlunosContext = createContext<AlunosContextValue | undefined>(undefined)

export const AlunosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const qc = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<Aluno[]>(
    ['alunos'],
    async () => {
      const { data } = await api.get('/api/v1/alunos/')
      return Array.isArray(data) ? data : data?.alunos ?? []
    },
    {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    }
  )

  const alunos = data ?? []
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)

  const refresh = async () => {
    await refetch()
  }

  const createAluno = async (payload: any) => {
    const { data } = await api.post('/api/v1/alunos/completo', payload)
    await qc.invalidateQueries({ queryKey: ['alunos'] })
    return data
  }

  const deleteAluno = async (id: string) => {
    await api.delete(`/api/v1/alunos/${id}`)
    await qc.invalidateQueries({ queryKey: ['alunos'] })
  }

  const value: AlunosContextValue = {
    alunos,
    loading: !!isLoading,
    error,
    refresh,
    selectAluno: setSelectedAluno,
    selectedAluno,
    createAluno,
    deleteAluno,
  }

  return <AlunosContext.Provider value={value}>{children}</AlunosContext.Provider>
}

export function useAlunosContext() {
  const ctx = useContext(AlunosContext)
  if (!ctx) throw new Error('useAlunosContext must be used within AlunosProvider')
  return ctx
}
