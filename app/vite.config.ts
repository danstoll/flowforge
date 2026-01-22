import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Use remote backend or local - set VITE_API_URL=http://10.0.0.115:4000 for remote
  const apiTarget = env.VITE_API_URL || 'http://localhost:4000';
  const wsTarget = apiTarget.replace('http', 'ws');

  return {
    plugins: [react(), tailwindcss()],
    root: '.',
    publicDir: 'public',
    build: {
      outDir: 'dist/client',
      emptyOutDir: true,
      sourcemap: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src/client'),
        '@data': path.resolve(__dirname, './src/server/data'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: wsTarget,
          ws: true,
        },
        '/health': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
