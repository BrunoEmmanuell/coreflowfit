import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAlunos } from '@/hooks/useAlunos'
import Layout from '@/components/layout/Layout'
import StudentsGrid from '@/components/StudentsGrid'
import NewStudentModal from '@/components/NewStudentModal'
import Button from '@/components/ui/Button'
import { Plus, Search } from 'lucide-react'
import Input from '@/components/ui/Input'

export default function Dashboard() {
  // Correção: Mapeando 'data' para 'alunos'
  const { data: alunos, isLoading, refetch } = useAlunos()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  // Filtragem simples local
  const filteredAlunos = (alunos || [])?.filter((a: any) => 
    a.nome?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div className="space-y-8">
        
        {/* Header do Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Meus Alunos</h1>
            <p className="text-slate-500 text-sm">Gerencie seus alunos e crie treinos personalizados</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-full md:w-64">
              <Input 
                placeholder="Buscar aluno..." 
                leftIcon={<Search size={18} className="text-slate-400"/>}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white"
              />
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="shrink-0 gap-2 shadow-lg shadow-blue-200">
              <Plus size={20} /> Novo Aluno
            </Button>
          </div>
        </div>

        {/* Grid de Alunos */}
        <StudentsGrid 
          students={filteredAlunos} 
          loading={isLoading}
          onViewProfile={(id: string) => navigate(`/aluno/${id}`)}
          onGenerateTreino={(id: string) => navigate(`/aluno/${id}`)} 
          onAddFirst={() => setIsModalOpen(true)}
        />

        {/* Modal de Criação */}
        <NewStudentModal 
          open={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false)
            // refetch não é estritamente necessário se usarmos invalidateQueries, mas mal não faz
            refetch() 
          }} 
        />
        
      </div>
    </Layout>
  )
}
