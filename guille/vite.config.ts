import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [basicSsl()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
      },
    },
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
});
