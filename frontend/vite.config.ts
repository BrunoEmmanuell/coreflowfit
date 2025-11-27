// vite.config.ts
import { defineConfig } from 'vite'
import path from 'node:path'

// Carregamento dinâmico do plugin React (evita problema ESM/require)
export default defineConfig(async () => {
  const react = (await import('@vitejs/plugin-react')).default

  return {
    plugins: [react()],
    resolve: {
      alias: {
        // mapeia @ -> <project-root>/src, usando path.resolve evita problemas no Windows
        '@': path.resolve(__dirname, 'src'),
      },
      // extensões padrão já cobertas, mas explicitamos para clareza
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },
    server: {
      port: 5173,
    },
    build: {
      // configurações de build seguras para Windows
      target: 'es2020',
      sourcemap: false,
    },
  }
})
