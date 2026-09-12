import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// As variaveis sao expostas via process.env para que o mesmo codigo funcione
// no Vite (browser) e no Jest (node), sem depender de import.meta.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:8080/api'),
      'process.env.VITE_USE_MOCK': JSON.stringify(env.VITE_USE_MOCK || 'true'),
    },
    server: {
      port: 5173,
      proxy: {
        // Usado quando VITE_USE_MOCK=false e o backend Spring Boot esta no 8080
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
});
