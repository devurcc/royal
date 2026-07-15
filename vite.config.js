import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import legacy from '@vitejs/plugin-legacy';
import { imageOptimizer } from './plugins/image-optimizer.mjs';

export default defineConfig({
  root: '.',
  base: '/',
  publicDir: 'public',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
    cssMinify: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('animejs')) return 'anime';
          return null;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name ?? '';
          if (/\.(css)$/i.test(info)) return 'assets/[name]-[hash][extname]';
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(info))
            return 'images/[name]-[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },

  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyTargets: ['defaults'],
      renderLegacyChunks: true,
      polyfills: ['es.promise.finally', 'es.array.from', 'es.array.includes'],
      modernPolyfills: ['es.promise.finally'],
    }),
    imageOptimizer(),
  ],

  server: {
    port: 5173,
    open: true,
  },

  preview: {
    port: 4173,
  },
});
