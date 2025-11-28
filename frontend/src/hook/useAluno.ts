
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export function useAluno(aluno_id?: number) {
  return useQuery(['aluno', aluno_id], async () => {
    const res = await api.get(`/api/v1/alunos/${aluno_id}`);
    return res.data;
  }, { enabled: Boolean(aluno_id) });
}
