// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig(async () => {
  const react = (await import('@vitejs/plugin-react')).default

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': '/src'
      }
    },
    server: {
      port: 5173
    }
  }
})
