import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  base: '/app',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
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
        '**/__workers__/**',
        '**/__snapshots__/**',
        '**/.DS_Store'
      ]
    }
  }
})
