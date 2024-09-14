import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import compression from 'vite-plugin-compression';
import autoprefixer from 'autoprefixer';

export default defineConfig({
    plugins: [
      react(), 
      viteTsconfigPaths(),
      compression({
        algorithm: 'gzip',
        ext: '.gz',
      })
    ],
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            redux: ['@reduxjs/toolkit', 'react-redux'],
          },
        },
      },
    },
    server: {
        open: true,
        port: 3000,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
    },
    css: {
        postcss: {
          plugins: [
            postcss([
              tailwindcss(),
              autoprefixer(),
            ]),
          ],
        },
      },
})