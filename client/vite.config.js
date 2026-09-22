import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

/**
 * `shared/` sits above this folder and is imported by both the client and the API,
 * so Vite is told it may read it and given a tidy alias for it.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) },
  },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
  },
});
