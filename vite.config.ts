import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@doc': path.resolve(__dirname, './doc'),
    },
  },
  plugins: [
    {
      name: 'bypass-spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          // If the browser requests a PDF or MD (e.g. inside an iframe), strip HTML from Accept header
          // so the vite:spa-fallback middleware doesn't rewrite it to index.html
          if (req.url?.match(/\.(pdf|md)(\?.*)?$/)) {
            req.headers.accept = '*/*';
          }
          next();
        });
      }
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      scope: process.env.VITE_BASE || '/',
      includeAssets: ['favicon.svg'],
      manifest: {
        start_url: process.env.VITE_BASE || '/',
        name: 'Tracks(ter) - A DAWless management tool',
        short_name: 'Tracks(ter)',
        description: 'Organize, preview, and manage your hybrid DAWless setup and sample packs.',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
        navigateFallbackDenylist: [/.*\.(pdf|md|apk|exe|zip)$/i],
      }
    }),
  ],
});
