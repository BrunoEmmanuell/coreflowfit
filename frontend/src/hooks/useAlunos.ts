import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export const useAlunos = () =>
  useQuery({ queryKey: {
    queryKey: ['alunos'], queryFn: queryFn: async ( }) => {
      const { data } = await api.get('/api/v1/alunos/')
      return data
    }
  })

