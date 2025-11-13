import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Default proxy target for dev. Keep this in sync with PORT used by backend dev script.
const target = process.env.VITE_API_URL || 'http://localhost:5177'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
