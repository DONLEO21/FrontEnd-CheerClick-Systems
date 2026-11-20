import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const backend = env.VITE_PROXY_TARGET || 'http://localhost:3001'

  return {
    plugins: [react()],
    server: {
      // El backend no tiene CORS: en desarrollo el navegador habla con Vite y Vite reenvía al backend.
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/uploads': { target: backend, changeOrigin: true }, // fotos de perfil
      },
    },
  }
})
