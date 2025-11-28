import React from 'react'
import { useParams } from 'react-router-dom'
import { useAluno } from '../hook/useAluno'
import { useTreinosDoAluno } from '../hook/useTreinos'
import Layout from '@/components/layout/Layout'
import { Dumbbell, Scale, Calendar, Mail, Bell } from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

const mockData = [
  { name: 'Jan', peso: 56 }, { name: 'Fev', peso: 59 },
  { name: 'Mar', peso: 58 }, { name: 'Abr', peso: 61 },
  { name: 'Mai', peso: 62 }, { name: 'Jun', peso: 63 },
]

export default function AlunoProfile() {
  const { aluno_id } = useParams()
  const { data: aluno, isLoading } = useAluno(Number(aluno_id))
  const { data: treinos } = useTreinosDoAluno(Number(aluno_id))

  if (isLoading) return <Layout><div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></Layout>

  return (
    <Layout>
      {/* Header Profile */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden border border-blue-100/50">
        {/* Efeito de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="w-28 h-28 rounded-full p-1 bg-white shadow-lg shadow-blue-100 z-10 shrink-0">
          <img 
            src="https://i.pravatar.cc/150?u=a042581f4e29026704d" 
            alt="Avatar" 
            className="w-full h-full rounded-full object-cover border-4 border-white" 
          />
        </div>
        
        <div className="flex-1 z-10 text-center md:text-left pt-2">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{aluno?.nome || "Mariana Santos"}</h1>
          <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase shadow-md shadow-blue-200">Ganho de Massa</span>
            <span className="bg-white text-slate-600 border border-slate-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase">Intermediário</span>
          </div>
        </div>

        <div className="flex gap-3 z-10 self-start mt-2">
          <button className="p-2.5 bg-white rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 shadow-sm border border-slate-100 transition-all"><Mail size={20} /></button>
          <button className="p-2.5 bg-white rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 shadow-sm border border-slate-100 transition-all"><Bell size={20} /></button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-sm font-bold text-slate-500">Total Treinos</span>
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Dumbbell size={20} /></div>
          </div>
          <div className="text-4xl font-bold text-slate-800 relative z-10">145 <span className="text-sm font-normal text-slate-400">gerados</span></div>
          <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 translate-y-4"><Dumbbell size={100} /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-slate-500">Últimas Medidas</span>
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><Scale size={20} /></div>
          </div>
          <div className="flex gap-8">
            <div><p className="text-xs text-slate-400 font-semibold uppercase mb-1">Peso</p><p className="font-bold text-slate-800 text-xl">62 kg</p></div>
            <div><p className="text-xs text-slate-400 font-semibold uppercase mb-1">Altura</p><p className="font-bold text-slate-800 text-xl">168 cm</p></div>
            <div><p className="text-xs text-slate-400 font-semibold uppercase mb-1">IMC</p><p className="font-bold text-slate-800 text-xl">22.0</p></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-purple-500 border-y border-r border-slate-100 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-sm font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded">Próximo Treino</span>
            <Calendar className="text-purple-400" size={20} />
          </div>
          <p className="font-bold text-slate-800 text-lg mb-1 leading-tight">Treino B: Superiores & Core</p>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Hoje • 18:30
          </p>
        </div>
      </div>

      {/* Grid Inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lista de Treinos */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span> Treinos Recentes
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all cursor-pointer group">
                <div className="flex gap-4 items-center">
                  <div className="bg-blue-100 text-blue-600 font-bold p-3 rounded-lg text-xs flex flex-col items-center leading-none w-12">
                    <span>15</span><span>MAI</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">Divisão A: Pernas & Glúteos</p>
                    <p className="text-xs text-slate-400 mt-0.5">Hipertrofia • 45 min</p>
                  </div>
                </div>
                <button className="text-sm font-semibold text-blue-600 bg-white border border-blue-100 px-4 py-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  Ver
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
               <span className="w-1 h-6 bg-blue-500 rounded-full"></span> Evolução de Peso
            </h3>
            <select className="bg-slate-50 border-none text-xs font-bold text-slate-500 rounded-lg py-1 px-3 outline-none">
              <option>Últimos 6 meses</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} 
                  dy={10}
                />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
                    padding: '12px 16px'
                  }}
                  itemStyle={{color: '#1e293b', fontWeight: 'bold'}}
                  cursor={{stroke: '#cbd5e1', strokeDasharray: '4 4'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="peso" 
                  stroke="#3B82F6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPeso)" 
                  activeDot={{r: 6, strokeWidth: 0, fill: '#2563eb'}}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </Layout>
  )
}
