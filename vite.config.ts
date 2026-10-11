/// <reference types="vitest/config" />
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

/** Shown in the app ("More" menu), from package.json. */
const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as {
  version: string;
};

// https://vite.dev/config/
export default defineConfig({
  build: {
    // The lazy-loaded encoder chunks are large but only fetched on export.
    chunkSizeWarningLimit: 800,
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  // GitHub Pages serves the app under /<repository>/ (set by the deploy workflow).
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      // Icons are generated from public/favicon.svg (see pwa-assets.config.ts).
      pwaAssets: { config: true },
      workbox: {
        // The audio encoders (~1 MB) load only when exporting MP3 / M4R: keep
        // them out of the install, cache them on first use instead.
        globIgnores: ['**/assets/mediabunny-*.js', '**/assets/src-*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'encoders' },
          },
        ],
      },
      manifest: {
        name: 'RingtoneComposer',
        short_name: 'Ringtones',
        description: 'Compose ringtones like on a Nokia 3310.',
        lang: 'en',
        theme_color: '#1f2a44',
        background_color: '#1f2a44',
        display: 'standalone',
        orientation: 'portrait',
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
