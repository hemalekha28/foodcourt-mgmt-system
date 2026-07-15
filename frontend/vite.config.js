
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL || env.VITE_API_URL || (mode === 'production' ? 'https://foodcourt-mgmt-system.onrender.com' : 'http://localhost:5000');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiBaseUrl,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
    },
    publicDir: 'public',
  };
});