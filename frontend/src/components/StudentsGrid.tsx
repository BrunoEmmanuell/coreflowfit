// src/components/StudentsGrid.tsx
import React from 'react'
import { useId } from 'react'
import { User, Play } from 'lucide-react'

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

type Props = {
  students: Aluno[]
  loading?: boolean
  onViewProfile?: (id: string) => void
  onGenerateTreino?: (id: string) => void
  onAddFirst?: () => void
}

/** pequenos utilitários */
function imc(peso?: number, altura?: number) {
  if (!peso || !altura) return null
  const h = altura / 100
  if (h === 0) return null
  return +(peso / (h * h)).toFixed(1)
}

/** componente skeleton simples */
function CardSkeleton({ keyIndex = 0 }: { keyIndex?: number }) {
  return (
    <div key={keyIndex} className="p-4 bg-white rounded-xl shadow-card flex flex-col gap-3 animate-pulse">
      <div className="h-20 w-20 rounded-full bg-slate-200 mx-auto" />
      <div className="h-4 w-3/5 bg-slate-200 mx-auto rounded" />
      <div className="h-3 w-2/5 bg-slate-200 mx-auto rounded" />
      <div className="h-4 w-full bg-slate-200 rounded mt-2" />
      <div className="h-8 w-full bg-slate-200 rounded" />
    </div>
  )
}

export default function StudentsGrid({ students, loading = false, onViewProfile, onGenerateTreino, onAddFirst }: Props) {
  const id = useId()

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={`${id}-s-${i}`} keyIndex={i} />
        ))}
      </div>
    )
  }

  if (!students || students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-48 h-48 rounded-full bg-slate-100 flex items-center justify-center mb-6">
          <User className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold">Nenhum aluno ainda</h3>
        <p className="text-sm text-slate-500 mb-4">Adicione seu primeiro aluno para começar a gerar treinos e acompanhar a evolução.</p>
        <button
          onClick={() => onAddFirst && onAddFirst()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
        >
          Adicionar Primeiro Aluno
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {students.map((a) => {
        const alunoNome = a.nome ?? '—'
        const alunoObjetivo = a.objetivo ?? '—'
        const alunoNivel = a.nivel ?? '—'
        const peso = a.peso ?? undefined
        const altura = a.altura ?? undefined
        const imcValor = imc(peso, altura)

        return (
          <div key={a.id} className="p-4 bg-white rounded-xl shadow-card flex flex-col justify-between">
            <div className="flex flex-col items-center gap-3">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                {a.fotoUrl ? (
                  // eslint-disable-next-line jsx-a11y/img-redundant-alt
                  <img src={a.fotoUrl} alt={`Foto de ${alunoNome}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-400">
                    <User className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold truncate">{alunoNome}</div>
                <div className="text-sm text-slate-500">{alunoObjetivo} • {alunoNivel}</div>
              </div>

              <div className="w-full grid grid-cols-3 gap-2 text-center mt-2">
                <div>
                  <div className="text-xs text-slate-400">Peso</div>
                  <div className="text-sm font-medium">{peso ?? '—'} kg</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Altura</div>
                  <div className="text-sm font-medium">{altura ?? '—'} cm</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">IMC</div>
                  <div className="text-sm font-medium">{imcValor ?? '—'}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => onViewProfile && onViewProfile(a.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-100 hover:bg-slate-50"
              >
                Ver Perfil
              </button>

              <button
                onClick={() => onGenerateTreino && onGenerateTreino(a.id)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
                title="Gerar treino"
              >
                <Play className="w-4 h-4" />
                <span className="hidden sm:inline">Gerar Treino</span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
