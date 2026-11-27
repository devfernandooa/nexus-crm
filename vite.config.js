import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

function gerarVersionJsonPlugin() {
  return {
    name: 'gerar-version-json',
    buildStart() {
      const publicDir = path.resolve(__dirname, 'public');
      fs.mkdirSync(publicDir, { recursive: true });

      const payload = {
        version: pkg.version,
        data: new Date().toISOString(),
        obrigatoria: false,
        destaques: [
          'Lembretes com horário e escala de cores por prazo em Minhas Tarefas',
          'Isolamento individual de tarefas por usuário',
          'Melhorias de performance e segurança',
        ],
      };

      fs.writeFileSync(
        path.join(publicDir, 'version.json'),
        JSON.stringify(payload, null, 2)
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), gerarVersionJsonPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});