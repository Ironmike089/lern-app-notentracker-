import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Project is served from https://<owner>.github.io/lern-app-notentracker-/
// so all assets must resolve relative to that sub-path in production.
const base = process.env.VITE_BASE_PATH ?? '/lern-app-notentracker-/'

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'))

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icon-maskable.svg'],
      manifest: {
        name: 'Notentracker',
        short_name: 'Notentracker',
        description: 'Deine Noten. Sofort im Blick.',
        theme_color: '#0d1512',
        background_color: '#0d1512',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
          {
            src: 'pwa-icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
