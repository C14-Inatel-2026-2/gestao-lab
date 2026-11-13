import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * O backend nao configura CORS, entao o navegador bloquearia chamadas de
 * localhost:5173 para localhost:8080. O proxy abaixo encaminha /api no proprio
 * servidor de desenvolvimento, mantendo tudo na mesma origem.
 *
 * BACKEND_URL permite apontar para outra porta (o Compose de deploy usa 8083).
 */
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: BACKEND_URL, changeOrigin: true },
      '/actuator': { target: BACKEND_URL, changeOrigin: true },
    },
  },
});
