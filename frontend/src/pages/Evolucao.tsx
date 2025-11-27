// src/pages/Evolucao.tsx
import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts'

import Layout from '@/components/layout/Layout'
import Card, { CardHeader, CardBody } from '@/components/ui/Card'
import Alert from '@/components/ui/Alert'
import Table, { Column } from '@/components/ui/Table'
import api from '@/services/api'
import Button from '@/components/ui/Button'

// Type for medida (adjust if backend uses other names)
type Medida = {
  id?: string
  data: string // ISO date
  peso?: number
  altura?: number
  cintura?: number
  peito?: number
  quadril?: number
  braco?: number
  coxa?: number
  panturrilha?: number
  [k: string]: any
}

// helper: BMI calculation with 1 decimal
function calcIMC(peso?: number, altura?: number) {
  if (!peso || !altura) return null
  const imc = peso / (altura * altura)
  return Math.round(imc * 10) / 10
}

// format date label (dd/mm)
function fmtShortDate(iso?: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString()
  } catch {
    return iso
  }
}

export default function EvolucaoPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const { data: medidas, isLoading, isError } = useQuery<Medida[]>(
    ['medidas', id],
    async () => {
      const { data } = await api.get(`/api/v1/medidas/${id}`)
      // ensure array
      return Array.isArray(data) ? data : data?.medidas ?? []
    },
    { enabled: !!id }
  )

  // sort medidas by date ascending
  const sorted = useMemo(() => {
    if (!medidas) return []
    return (medidas.slice() as Medida[]).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  }, [medidas])

  // chartData with peso & imc
  const chartData = useMemo(() => {
    return sorted.map((m) => ({
      date: fmtShortDate(m.data),
      peso: typeof m.peso === 'number' ? m.peso : null,
      imc: calcIMC(m.peso, m.altura),
    }))
  }, [sorted])

  // comparison before/after (first vs last)
  const comparison = useMemo(() => {
    if (!sorted || sorted.length === 0) return null
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    return {
      first: {
        date: fmtShortDate(first.data),
        peso: first.peso ?? null,
        imc: calcIMC(first.peso, first.altura),
        cintura: first.cintura ?? null,
        peito: first.peito ?? null,
        quadril: first.quadril ?? null,
      },
      last: {
        date: fmtShortDate(last.data),
        peso: last.peso ?? null,
        imc: calcIMC(last.peso, last.altura),
        cintura: last.cintura ?? null,
        peito: last.peito ?? null,
        quadril: last.quadril ?? null,
      },
    }
  }, [sorted])

  // table columns
  const columns: Column<Medida>[] = [
    { key: 'data', header: 'Data', sortable: true, render: (r) => fmtShortDate(r.data) },
    { key: 'peso', header: 'Peso (kg)', sortable: true, render: (r) => (r.peso ?? '—') },
    { key: 'altura', header: 'Altura (m)', sortable: false, render: (r) => (r.altura ?? '—') },
    { key: 'imc', header: 'IMC', sortable: true, render: (r) => (calcIMC(r.peso, r.altura) ?? '—') },
    { key: 'cintura', header: 'Cintura (cm)', sortable: false, render: (r) => (r.cintura ?? '—') },
    { key: 'peito', header: 'Peito (cm)', sortable: false, render: (r) => (r.peito ?? '—') },
  ]

  if (isLoading) {
    return (
      <Layout>
        <div className="py-24 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
            <div className="text-sm text-slate-500">Carregando evolução...</div>
          </div>
        </div>
      </Layout>
    )
  }

  if (isError) {
    return (
      <Layout>
        <div className="py-12">
          <Alert type="error" title="Erro" description="Não foi possível carregar as medidas do aluno." dismissible />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Evolução</h1>
            <p className="text-sm text-slate-500">Gráficos e histórico de medidas do aluno</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={() => window.print()}>
              Imprimir
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                // quick export CSV
                const rows = sorted.map((m) => ({
                  data: m.data,
                  peso: m.peso ?? '',
                  altura: m.altura ?? '',
                  imc: calcIMC(m.peso, m.altura) ?? '',
                  cintura: m.cintura ?? '',
                  peito: m.peito ?? '',
                  quadril: m.quadril ?? '',
                }))
                const csv = [
                  Object.keys(rows[0] || {}).join(','),
                  ...rows.map((r) => Object.values(r).map((v) => (v ?? '')).join(',')),
                ].join('\n')
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `evolucao_${id || 'aluno'}.csv`
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card variant="elevated">
            <CardHeader>Evolução de Peso</CardHeader>
            <CardBody>
              {chartData.length === 0 ? (
                <div className="text-sm text-slate-500">Sem dados de peso</div>
              ) : (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="peso" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>

          <Card variant="elevated">
            <CardHeader>Evolução do IMC</CardHeader>
            <CardBody>
              {chartData.length === 0 ? (
                <div className="text-sm text-slate-500">Sem dados</div>
              ) : (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="imc" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>

          <Card variant="elevated">
            <CardHeader>Comparação Antes / Depois</CardHeader>
            <CardBody>
              {!comparison ? (
                <div className="text-sm text-slate-500">Sem dados para comparação</div>
              ) : (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={[
                        {
                          label: `Antes (${comparison.first.date})`,
                          peso: comparison.first.peso ?? 0,
                          imc: comparison.first.imc ?? 0,
                          cintura: comparison.first.cintura ?? 0,
                        },
                        {
                          label: `Depois (${comparison.last.date})`,
                          peso: comparison.last.peso ?? 0,
                          imc: comparison.last.imc ?? 0,
                          cintura: comparison.last.cintura ?? 0,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="peso" name="Peso (kg)" stackId="a" fill="#2563eb" />
                      <Bar dataKey="imc" name="IMC" stackId="a" fill="#16a34a" />
                      <Bar dataKey="cintura" name="Cintura (cm)" stackId="a" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Full table */}
        <Card variant="default">
          <CardHeader>Histórico de Medidas</CardHeader>
          <CardBody>
            {sorted.length === 0 ? (
              <div className="text-sm text-slate-500">Nenhuma medida registrada.</div>
            ) : (
              <Table
                columns={columns}
                data={sorted.map((m) => ({ ...m, imc: calcIMC(m.peso, m.altura) }))}
                loading={false}
                emptyMessage="Sem registros"
                onRowClick={() => {}}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </Layout>
  )
}
