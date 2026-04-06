import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('@google/genai') || id.includes('@google/generative-ai')) {
              return 'ai';
            }
            if (id.includes('lucide-react') || id.includes('sonner') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'ui';
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    host: true
  }
})
