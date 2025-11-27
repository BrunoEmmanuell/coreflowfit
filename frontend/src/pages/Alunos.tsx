import React from 'react'
import Layout from '@/components/layout/Layout'
import { useAlunos } from '@/hooks/useAlunos'
import { Link } from 'react-router-dom'

export default function Alunos() {
  const { data } = useAlunos()
  return (
    <Layout>
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Alunos</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-slate-500">
              <th>Nome</th>
              <th>Objetivo</th>
              <th>Última sessão</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((a: any) => (
              <tr key={a.id} className="border-t">
                <td className="py-2">
                  <Link to={`/alunos/${a.id}`} className="text-indigo-600">
                    {a.nome || a.name || '—'}
                  </Link>
                </td>
                <td>{a.objetivo || '—'}</td>
                <td>{a.ultima_sessao || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
