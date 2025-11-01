import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const target = process.env.VITE_API_URL || 'http://localhost:5174'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API calls from Vite (5173) to backend
      '/api': {
        target,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
