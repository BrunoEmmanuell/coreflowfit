import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { AlunosProvider } from './contexts/AlunosContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AlunoProfile from './pages/AlunoProfile';
import TreinoDetail from './pages/TreinoDetail';
import Evolucao from './pages/Evolucao';
import Configuracoes from './pages/Configuracoes'; // Nova página
import PrivateRoute from './components/PrivateRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 1000 * 60 * 2 },
  },
});

;(window as any).__REACT_QUERY_CLIENT = queryClient;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AlunosProvider queryClient={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Rotas Privadas (Só Admin vê) */}
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/aluno/:aluno_id" element={<AlunoProfile />} />
                <Route path="/treino/:id" element={<TreinoDetail />} />
                <Route path="/evolucao" element={<Evolucao />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
              </Route>

              {/* Redirecionar qualquer erro para o login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AlunosProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
