// src/App.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setNavigate } from '@/services/routerNavigate'

export default function App() {
  const navigate = useNavigate()

  // Permite que o Axios use o navigate fora de componentes
  useEffect(() => {
    setNavigate(navigate)
  }, [navigate])

  return (
    // ... seu Router / Rotas
  )
}
