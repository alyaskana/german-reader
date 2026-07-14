import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Base path for GitHub Pages: https://<user>.github.io/german-reader/
// Override with BASE_PATH env if the repo is named differently.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/german-reader/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['apple-touch-icon.png'],
      workbox: {
        // precache the app shell + all bundled stories/covers for offline reading
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        runtimeCaching: [
          {
            // Google Fonts stylesheet + font files — cache so type survives offline
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Story narration mp3 — cache on first play so audio works offline.
            // Not precached (would bloat the install); fetched lazily instead.
            urlPattern: ({ url }) => url.pathname.includes('/audio/') && url.pathname.endsWith('.mp3'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'story-audio',
              rangeRequests: true,
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Lesezeit — истории на немецком',
        short_name: 'Lesezeit',
        description: 'Ридер адаптированных немецких историй с переводами у сложных слов.',
        lang: 'ru',
        theme_color: '#f5a623',
        background_color: '#f6f2ea',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
