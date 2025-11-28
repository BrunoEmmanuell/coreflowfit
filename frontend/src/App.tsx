import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { AlunosProvider } from './contexts/AlunosContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AlunoProfile from './pages/AlunoProfile';
import TreinoDetail from './pages/TreinoDetail';
import Evolucao from './pages/Evolucao';
import PrivateRoute from './components/PrivateRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 1000 * 60 * 2 },
  },
});

// fallback global (somente para ambientes de debug/incompatibilidade)
;(window as any).__REACT_QUERY_CLIENT = queryClient;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* passamos explicitamente o queryClient para o AlunosProvider */}
        <AlunosProvider queryClient={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/aluno/:aluno_id" element={<AlunoProfile />} />
                <Route path="/treino/:id" element={<TreinoDetail />} />
                <Route path="/evolucao" element={<Evolucao />} />
              </Route>
              <Route path="*" element={<Login />} />
            </Routes>
          </BrowserRouter>
        </AlunosProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
