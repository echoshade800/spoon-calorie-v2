import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
  },
  define: {
    global: 'globalThis',
    'process.env': 'process.env',
  },
  optimizeDeps: {
    include: ['process'],
  },
  build: {
    outDir: 'dist',
  },
});