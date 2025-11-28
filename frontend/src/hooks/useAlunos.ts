import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export const useAlunos = () =>
  useQuery(['alunos'], async () => {
    const { data } = await api.get('/api/v1/alunos/')
    return data
  })
