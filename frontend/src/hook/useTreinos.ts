import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../services/api';

export function useTreinosDoAluno(aluno_id?: number) {
  return useQuery({
    queryKey: ['treinos', aluno_id],
    queryFn: async () => {
      const res = await api.get(`/api/v1/treinos/aluno/${aluno_id}`);
      return res.data;
    },
    enabled: Boolean(aluno_id),
  });
}

export function useGerarTreino() {
  return useMutation<any, Error, any>({
    mutationFn: async (payload: any) => {
      const res = await api.post('/api/v1/treinos/gerar', payload);
      return res.data;
    },
  });
}
