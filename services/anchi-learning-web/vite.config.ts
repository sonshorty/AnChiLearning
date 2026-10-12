import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'AnChi Learning',
        short_name: 'AnChi',
        description: 'Cùng con học Toán và Tiếng Việt mỗi ngày',
        theme_color: '#146B65',
        background_color: '#F5FAF8',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  server: {
    host: true,
    allowedHosts: true,
    strictPort: false,
    proxy: { '/api': process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000' },
  },
});