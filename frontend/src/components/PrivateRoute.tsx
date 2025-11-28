
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export default function PrivateRoute() {
  const { token, loading } = useAuthContext();
  if (loading) return <div className="p-6">Carregando...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}
