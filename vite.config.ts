import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import { markdownIndex } from './scripts/markdownIndexPlugin';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
    manifest: true,
  },
  optimizeDeps: {
    exclude: ['decap-cms-app', 'decap-cms-core'],
  },
  plugins: [
    markdownIndex({
      entries: [
        {
          folderPath: 'src/content/conditions',
          output: 'src/routes/conditions/-list.gen.json',
        },
        {
          folderPath: 'src/content/treatments',
          output: 'src/routes/treatments/-list.gen.json',
        },
        {
          folderPath: 'src/content/calc',
          output: 'src/routes/calc/-list.gen.json',
        },
        {
          folderPath: 'src/content/algorithms',
          output: 'src/routes/algorithms/-list.gen.json',
        },
      ],
    }),
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    tailwindcss(),
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', '*.svg', '*.png', 'assets/**/*'],
      workbox: {
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/admin/, /^\/\.vite/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/0xygaj8b07\.ufs\.sh\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Quick Med',
        short_name: 'Quick Med',
        description: 'Medicine quick reference',
        theme_color: '#414558',
        background_color: '#edeff7',
        orientation: 'portrait',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
