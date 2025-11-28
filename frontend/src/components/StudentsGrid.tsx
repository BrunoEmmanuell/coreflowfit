import React from 'react'
import { User, Eye, Dumbbell, MoreHorizontal } from 'lucide-react'

// Helper para cores das tags (Badges)
const getTagColor = (tag: string) => {
  const t = tag?.toLowerCase() || ''
  if (t.includes('emagrecimento')) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (t.includes('hipertrofia')) return 'bg-slate-100 text-slate-700 border-slate-200'
  if (t.includes('ganho')) return 'bg-blue-100 text-blue-700 border-blue-200'
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

const getLevelColor = (level: string) => {
  const l = level?.toLowerCase() || ''
  if (l.includes('iniciante')) return 'bg-amber-50 text-amber-700 border-amber-200'
  if (l.includes('intermediário')) return 'bg-purple-50 text-purple-700 border-purple-200'
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

export default function StudentsGrid({ students, loading, onViewProfile, onGenerateTreino }: any) {
  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {[1,2,3].map(i => <div key={i} className="h-64 bg-white rounded-2xl animate-pulse shadow-sm" />)}
    </div>
  )

  if (!students || students.length === 0) return <div className="p-8 text-center text-slate-500">Nenhum aluno encontrado.</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
      {students.map((aluno: any) => (
        <div key={aluno.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all group relative">
          
          <button className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 transition-colors">
            <MoreHorizontal size={20} />
          </button>

          {/* Header do Card */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shrink-0 overflow-hidden">
              {aluno.foto ? (
                <img src={aluno.foto} className="w-full h-full object-cover" alt={aluno.nome} />
              ) : (
                <User size={32} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{aluno.nome}</h3>
              <div className="flex flex-wrap gap-2">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getTagColor(aluno.objetivo || 'Hipertrofia')}`}>
                  {aluno.objetivo || 'Hipertrofia'}
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getLevelColor(aluno.nivel || 'Iniciante')}`}>
                  {aluno.nivel || 'Iniciante'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Peso</p>
              <p className="font-bold text-slate-700 text-lg">{aluno.peso || '70'} <span className="text-xs font-normal text-slate-400">kg</span></p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Altura</p>
              <p className="font-bold text-slate-700 text-lg">{aluno.altura || '170'} <span className="text-xs font-normal text-slate-400">cm</span></p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button 
              onClick={() => onViewProfile(aluno.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Eye size={16} /> Ver Perfil
            </button>
            <button 
              onClick={() => onGenerateTreino(aluno.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5"
            >
              <Dumbbell size={16} /> Gerar Treino
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
