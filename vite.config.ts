import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'labels/*'],
      manifest: {
        name: 'TrailMate - Outdoor Quest & AI Companion',
        short_name: 'TrailMate',
        description: 'Offline-first outdoor quest companion powered by on-device AI',
        theme_color: '#15803d',
        background_color: '#052e16',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell + the self-hosted ONNX runtime (.mjs/.wasm are emitted into assets/)
        globPatterns: ['**/*.{js,mjs,wasm,css,html,ico,png,svg,json,webmanifest}'],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 5173, host: true },
  worker: { format: 'es' },
});