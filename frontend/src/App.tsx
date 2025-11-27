import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importe os componentes (que agora serão todos .tsx)
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HistoricoTreinos from './pages/HistoricoTreinos';
import AlunoPerfil from './pages/AlunoPerfil';
import Evolucao from './pages/Evolucao';
import Treino from './pages/Treino';

// Proteção de Rota (Só deixa entrar se tiver token)
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rotas Privadas (Dashboard e Funcionalidades) */}
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/dashboard" element={<Navigate to="/" />} />
        <Route path="/historico" element={<PrivateRoute><HistoricoTreinos /></PrivateRoute>} />
        <Route path="/aluno/:id" element={<PrivateRoute><AlunoPerfil /></PrivateRoute>} />
        <Route path="/evolucao/:id" element={<PrivateRoute><Evolucao /></PrivateRoute>} />
        <Route path="/treino/:id" element={<PrivateRoute><Treino /></PrivateRoute>} />
        
        {/* Rota Padrão para erros 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;