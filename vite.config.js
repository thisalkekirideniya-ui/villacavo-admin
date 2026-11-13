import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The website runs on 5173, the admin on 5174, the backend (separate repo) on 5175.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
  preview: { port: 5174 },
})
