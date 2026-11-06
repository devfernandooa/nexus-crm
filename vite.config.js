import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
<<<<<<< HEAD
import path from 'node:path'
import { fileURLToPath } from 'node:url' // <-- Adicione

// Cria o __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
=======
import path from 'node:path' // <-- Adicione esta linha
>>>>>>> 20aea7d (feat(ui): refatora telas de autenticação, layout premium e documentação base)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
<<<<<<< HEAD
=======
      // Agora '@' representa a pasta 'src'
>>>>>>> 20aea7d (feat(ui): refatora telas de autenticação, layout premium e documentação base)
      '@': path.resolve(__dirname, './src'),
    },
  },
})