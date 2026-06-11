import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://watchparty-vul6.onrender.com](https://watchparty-vul6.onrender.com',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://watchparty-vul6.onrender.com](https://watchparty-vul6.onrender.com',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
