import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // The build does not know the path a reverse proxy serves Echo under: its URLs are relative, and
  // the backend gives index.html the <base> they resolve against. The dev server has none in front.
  base: command === 'build' ? './' : '/app',
  plugins: [
    react(),
    {
      // The backend gives index.html the <base> the app reads where it is reached from; in
      // development, the Vite dev server serves it without the backend.
      name: 'echo-app-base',
      apply: 'serve',
      transformIndexHtml: (html): string => html.replace('<head>', '<head><base href="/app/">')
    }
  ],
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/documentation': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    globalSetup: './vitest.globalSetup.ts',
    setupFiles: './src/setupTests.ts',
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: [
        'src/main.tsx',
        'src/App.tsx',
        'src/test/**',
        'src/modules/logs/infra/workers/filterWorker.ts',
        '**/__snapshots__/**',
        '**/.DS_Store'
      ]
    }
  }
}))
