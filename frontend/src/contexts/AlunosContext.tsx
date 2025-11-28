// src/contexts/AlunosContext.tsx
import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import type { QueryClient } from '@tanstack/react-query';

export type Aluno = { id: number; nome: string; };

type AlunosContextType = {
  alunos: Aluno[] | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<any>;
  criarAluno: (payload: any) => Promise<any>;
};

const AlunosContext = createContext<AlunosContextType | undefined>(undefined);

async function fetchAlunos() {
  const res = await api.get('/api/v1/alunos/');
  return res.data as Aluno[];
}

async function criarAlunoApi(payload: any) {
  const res = await api.post('/api/v1/alunos/completo', payload);
  return res.data;
}

/**
 * AlunosProvider
 * @param children
 * @param queryClient optional QueryClient passed from App
 */
export function AlunosProvider({
  children,
  queryClient,
}: {
  children: ReactNode;
  queryClient?: QueryClient | null;
}) {
  // useQuery para listar alunos
  const { data, isLoading, isError, refetch } = useQuery<Aluno[], Error>({
    queryKey: ['alunos'],
    queryFn: fetchAlunos,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // mutation para criar aluno; no onSuccess usamos o queryClient recebido como prop
  const mutation = useMutation<any, Error, any>(criarAlunoApi, {
    onSuccess: () => {
      try {
        if (queryClient) {
          queryClient.invalidateQueries({ queryKey: ['alunos'] });
        } else if ((window as any).__REACT_QUERY_CLIENT) {
          (window as any).__REACT_QUERY_CLIENT.invalidateQueries({ queryKey: ['alunos'] });
        }
      } catch (e) {
        // nÃ£o falhar a renderizaÃ§Ã£o por causa da invalidaÃ§Ã£o
        // sÃ³ logamos o aviso
        // eslint-disable-next-line no-console
        console.warn('AlunosContext: nÃ£o foi possÃ­vel invalidar queries automaticamente', e);
      }
    },
  });

  async function criarAluno(payload: any) {
    return mutation.mutateAsync(payload);
  }

  return (
    <AlunosContext.Provider
      value={{
        alunos: data,
        isLoading,
        isError: Boolean(isError),
        refetch,
        criarAluno,
      }}
    >
      {children}
    </AlunosContext.Provider>
  );
}

export function useAlunosContext() {
  const ctx = useContext(AlunosContext);
  if (!ctx) throw new Error('useAlunosContext must be used within AlunosProvider');
  return ctx;
}

