// src/pages/AlunoProfile.tsx
import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Button from '@/components/ui/Button'
import api from '@/services/api'
import { useQuery } from '@tanstack/react-query'
import { useAlunosContext } from '@/contexts/AlunosContext'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AlunoProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery(['aluno', id], async () => {
    const { data } = await api.get(`/api/v1/alunos/${id}`)
    return data
  })

  if (isLoading) return (
    <Layout>
      <div>Carregando...</div>
    </Layout>
  )

  if (!data) return (
    <Layout>
      <div>Aluno não encontrado</div>
    </Layout>
  )

  const aluno = data

  // extrair histórico de medidas para gráfico (assume formato { data: [{peso, date}, ...] })
  const pesoSeries = (aluno?.medidasHistorico ?? []).map((m: any) => ({ date: m.data || m.date || m.created_at, peso: m.peso }))

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{aluno.nome}</h1>
          <div className="text-sm text-slate-500">{aluno.objetivo}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>Voltar</Button>
          <Button variant="danger" onClick={async () => {
            if (!confirm('Deseja excluir este aluno?')) return
            await api.delete(`/api/v1/alunos/${id}`)
            navigate('/dashboard')
          }}>Excluir</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="p-4 bg-white rounded-xl shadow-card">
            <h3 className="font-medium mb-2">Resumo</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-slate-400">Peso</div>
                <div className="text-lg font-medium">{aluno.peso ?? '—'} kg</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Altura</div>
                <div className="text-lg font-medium">{aluno.altura ?? '—'} cm</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">IMC</div>
                <div className="text-lg font-medium">
                  {aluno.peso && aluno.altura ? ( (aluno.peso / ((aluno.altura/100)**2)).toFixed(1) ) : '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl shadow-card">
            <h3 className="font-medium mb-3">Treinos Recentes</h3>
            <ul className="space-y-2">
              {(aluno.treinos ?? []).slice(0,5).map((t: any) => (
                <li key={t.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t.nome || t.divisao || 'Treino'}</div>
                    <div className="text-xs text-slate-500">{t.data || t.created_at}</div>
                  </div>
                  <div>
                    <Button variant="ghost" onClick={() => navigate(`/treino/${t.id}`)}>Ver Detalhes</Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="p-4 bg-white rounded-xl shadow-card">
            <h4 className="font-medium mb-2">Evolução de peso</h4>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pesoSeries}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="peso" stroke="#2563eb" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl shadow-card">
            <h4 className="font-medium mb-2">Próximo Treino</h4>
            <div>{(aluno.proximoTreino && aluno.proximoTreino.nome) || 'Nenhum agendado'}</div>
          </div>
        </aside>
      </div>
    </Layout>
  )
}
