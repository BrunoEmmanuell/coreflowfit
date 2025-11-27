// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AlunoPerfil from "./pages/AlunoPerfil";
import Treino from "./pages/Treino";
import HistoricoTreinos from "./pages/HistoricoTreinos";
import Evolucao from "./pages/Evolucao";

// Componente de Rota Protegida
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rotas Protegidas */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* Perfil do Aluno */}
        <Route path="/aluno/:id" element={<ProtectedRoute><AlunoPerfil /></ProtectedRoute>} />
        
        {/* --- NOVA ROTA AQUI --- */}
        {/* Evolução Específica do Aluno (Gráficos) */}
        <Route path="/aluno/:id/evolucao" element={<ProtectedRoute><Evolucao /></ProtectedRoute>} />
        
        {/* Visualização de Treino */}
        <Route path="/treino/:id" element={<ProtectedRoute><Treino /></ProtectedRoute>} />
        
        {/* Outras Rotas */}
        <Route path="/historico" element={<ProtectedRoute><HistoricoTreinos /></ProtectedRoute>} />
        <Route path="/evolucao" element={<ProtectedRoute><Evolucao /></ProtectedRoute>} />
        
        {/* Fallback (404) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;