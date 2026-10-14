import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  let outDir = ''

  return {
    // The build does not know the path a reverse proxy serves the app under: its URLs are
    // relative, and whatever serves index.html gives it the <base> they resolve against. The dev
    // server has no proxy in front.
    base: command === 'build' ? './' : '/app',
    plugins: [
      react(),
      {
        // The app reads where it is reached from the <base> of index.html, which whatever serves
        // the build adds: in development, the Vite dev server is the one serving it.
        name: 'echo-app-base',
        apply: 'serve',
        transformIndexHtml: (html): string => html.replace('<head>', '<head><base href="/app/">')
      },
      {
        // Vite copies the whole of public/ to the build, and cannot leave a file out: the config of
        // the dev server is removed once it is there.
        name: 'echo-without-development-env',
        apply: 'build',
        configResolved: (config): void => {
          outDir = resolve(config.root, config.build.outDir)
        },
        closeBundle: (): Promise<void> =>
          rm(resolve(outDir, 'env.development.json'), { force: true })
      }
    ],
    server: {
      host: '127.0.0.1',
      // The `Host` header is forwarded as it is: the API only answers a request whose `Origin` is
      // the host it was sent to. A target written as a string would replace it with the host of the
      // target, as Vite then enables `changeOrigin` on its own.
      proxy: {
        '/api': { target: 'http://localhost:4000' },
        '/documentation': { target: 'http://localhost:4000' }
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
          'src/test/**',
          'src/modules/logs/infra/workers/filterWorker.ts',
          '**/__snapshots__/**',
          '**/.DS_Store'
        ]
      }
    }
  }
})
