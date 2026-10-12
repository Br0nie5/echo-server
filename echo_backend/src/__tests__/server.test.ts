import path from 'path'

import type * as FastifyModule from 'fastify'
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { logsNotifier } from '../modules/logs/modules/logsNotifier/presentation/logs.notifier.js'
import { startServer } from '../server.js'
import type { BackConfig } from '../shared/config/backConfig.js'
import { loadBackConfig as actualLoadBackConfig } from '../shared/config/loadBackConfig.js'
import type * as FilesServiceModule from '../shared/services/files.service.js'
import { buildTestServer } from '../test/buildTestServer.js'
import {
  getMockAuthConfig,
  getMockBackConfig,
  getMockLogsConfig,
  getMockLogsNotifierConfig,
  getMockNotificationConfig,
  getMockServerConfig
} from '../test/mocks/mockConfigs.js'

// Unit tests of the server itself: what it serves and where, its documentation, its frontend, its
// CORS and proxy settings, and how it starts. The routes and the cron are tested with their module,
// so they are replaced here, and a change in one of them changes nothing in this file.
const moduleStubs = vi.hoisted(() => ({ logsRoutesError: undefined as Error | undefined }))

vi.mock('../modules/logs/presentation/logs.routes.js', () => ({
  logsRoutes: async (server: FastifyInstance): Promise<void> => {
    if (moduleStubs.logsRoutesError) {
      throw moduleStubs.logsRoutesError
    }

    server.get('/logs', async () => [])
    server.get('/logs/failing', async () => {
      throw new Error('Some internal detail.')
    })
    server.get('/logs/redirecting', async (_request, reply) => reply.redirect('/api/logs'))
  }
}))

vi.mock('../modules/auth/presentation/auth.routes.js', () => ({
  authRoutes: async (server: FastifyInstance): Promise<void> => {
    server.get('/auth/check', async () => ({ success: true }))
  }
}))

vi.mock('../modules/logs/modules/logsNotifier/presentation/logs.notifier.js', () => ({
  logsNotifier: vi.fn(async () => {})
}))

vi.mock('../shared/config/loadBackConfig.js')

// `startServer` builds its own files service, on the real file system: it is given one in memory.
vi.mock('../shared/services/files.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof FilesServiceModule>()
  const { createInMemoryFileSystem } = await import('../test/mocks/inMemoryFileSystem.js')

  const createFilesService: typeof actual.createFilesService = (
    fileSystem = createInMemoryFileSystem({ files: { ':memory:': '' }, directories: ['/logs'] })
      .fileSystem,
    ...otherArguments
  ) => actual.createFilesService(fileSystem, ...otherArguments)

  return { ...actual, createFilesService }
})

// The server is created without two of the options `buildServer` asks for: its logger would write
// to the output of the tests, and the TLS certificate of the tests is not a real one, which the
// HTTPS server of Node.js refuses. It never opens a port either: `listen` is a stub.
const fastifyStubs = vi.hoisted(() => ({
  listen: vi.fn<() => Promise<string>>(),
  logInfo: vi.fn(),
  logError: vi.fn(),
  builtServers: [] as FastifyInstance[]
}))

vi.mock('fastify', async (importOriginal) => {
  const actual = await importOriginal<typeof FastifyModule>()

  return {
    ...actual,
    default: vi.fn((options: FastifyServerOptions) => {
      const server = actual.default({
        ...options,
        logger: false,
        https: undefined
      } as never) as unknown as FastifyInstance

      vi.spyOn(server, 'listen').mockImplementation(fastifyStubs.listen as never)
      vi.spyOn(server.log, 'info').mockImplementation(fastifyStubs.logInfo)
      vi.spyOn(server.log, 'error').mockImplementation(fastifyStubs.logError)
      fastifyStubs.builtServers.push(server)

      return server
    })
  }
})

const loadBackConfig = vi.mocked(actualLoadBackConfig)

// The assets of the frontend are read from the disk by @fastify/static itself, which has no seam
// to give it another file system: they are fixture files, only read.
const frontendDistDirPath = path.join(import.meta.dirname, 'fixtures', 'frontendDist')
const indexHtmlFiles = {
  [path.join(frontendDistDirPath, 'index.html')]: '<!doctype html><head><title>Echo</title></head>'
}

const getInMemoryAuthConfig = (): BackConfig['auth'] =>
  getMockAuthConfig({ usersDbFilePath: ':memory:' })

afterEach(async () => {
  await Promise.all(fastifyStubs.builtServers.map((server) => server.close()))
  fastifyStubs.builtServers.length = 0
  moduleStubs.logsRoutesError = undefined
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

describe('buildServer', () => {
  describe('Routes', () => {
    test('Should serve the routes of the API under /api', async () => {
      const { server } = await buildTestServer()

      expect((await server.inject('/api/logs')).statusCode).toBe(200)
      expect((await server.inject('/api/auth/check')).statusCode).toBe(200)
      expect((await server.inject('/logs')).statusCode).toBe(404)
    })

    test('Should have no auth route without authentication', async () => {
      const { server } = await buildTestServer({ config: { auth: undefined } })

      expect((await server.inject('/api/logs')).statusCode).toBe(200)
      expect((await server.inject('/api/auth/check')).statusCode).toBe(404)
    })

    test('Should answer a 404 error to a path that is no route', async () => {
      const { server } = await buildTestServer()

      const response = await server.inject('/api/unknown')

      expect(response.statusCode).toBe(404)
      expect(response.json()).toEqual({ statusCode: 404, message: 'Not found.' })
    })

    test('Should answer a 500 error that says nothing of what failed when a route throws', async () => {
      const { server } = await buildTestServer()

      const response = await server.inject('/api/logs/failing')

      expect(response.statusCode).toBe(500)
      expect(response.json()).toEqual({
        statusCode: 500,
        message: 'An unexpected error occurred.'
      })
    })
  })

  describe('Logs notifier', () => {
    const logsWithNotifierConfig = getMockLogsConfig({ logsNotifier: getMockLogsNotifierConfig() })

    test('Should start the logs notifier when it is configured along with the notifications', async () => {
      await buildTestServer({
        config: { logs: logsWithNotifierConfig, notification: getMockNotificationConfig() }
      })

      expect(logsNotifier).toHaveBeenCalledOnce()
    })

    test.each<{ reason: string; config: Partial<BackConfig> }>([
      { reason: 'the notifications are not configured', config: { logs: logsWithNotifierConfig } },
      {
        reason: 'the logs notifier is not configured',
        config: { notification: getMockNotificationConfig() }
      },
      { reason: 'neither the notifications nor the logs notifier are configured', config: {} }
    ])('Should not start the logs notifier when $reason', async ({ config }) => {
      await buildTestServer({ config })

      expect(logsNotifier).not.toHaveBeenCalled()
    })
  })

  describe('Documentation', () => {
    test('Should serve the documentation of the routes when the config asks for it', async () => {
      const { server } = await buildTestServer({
        config: { server: getMockServerConfig({ hasDocumentationRoute: true }) }
      })

      const response = await server.inject('/documentation/json')

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({ info: { title: 'Echo API' } })
      expect(Object.keys(response.json().paths)).toContain('/api/logs')
      expect(response.json()).not.toHaveProperty('servers')
    })

    test('Should say in the documentation that the routes are below the base path', async () => {
      const { server } = await buildTestServer({
        config: { server: getMockServerConfig({ hasDocumentationRoute: true, basePath: '/echo' }) }
      })

      const response = await server.inject('/documentation/json')

      expect(response.json()).toMatchObject({ servers: [{ url: '/echo' }] })
    })

    test('Should serve no documentation when the config does not ask for it', async () => {
      const { server } = await buildTestServer({
        config: { server: getMockServerConfig({ hasDocumentationRoute: false }) }
      })

      expect((await server.inject('/documentation/json')).statusCode).toBe(404)
      expect((await server.inject('/documentation')).statusCode).toBe(404)
    })
  })

  describe('Base path', () => {
    test('Should route a request the same with the base path of the config or without it', async () => {
      const { server } = await buildTestServer({
        config: { server: getMockServerConfig({ basePath: '/echo' }) }
      })

      expect((await server.inject('/echo/api/logs')).statusCode).toBe(200)
      expect((await server.inject('/api/logs')).statusCode).toBe(200)
      expect((await server.inject('/echoes/api/logs')).statusCode).toBe(404)
    })

    test('Should send a redirection to a path of the server below the base path', async () => {
      const { server } = await buildTestServer({
        config: { server: getMockServerConfig({ basePath: '/echo' }) }
      })

      const response = await server.inject('/echo/api/logs/redirecting')

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/echo/api/logs')
    })
  })

  describe('Frontend', () => {
    test.each(['/app', '/app/', '/app/logs?fromDate=2026-04-26', '/app/index.html'])(
      'Should answer %s with the page of the frontend, told where it is served',
      async (url) => {
        const { server } = await buildTestServer({
          config: { server: getMockServerConfig({ frontendDistDirPath }) },
          files: indexHtmlFiles
        })

        const response = await server.inject(url)

        expect(response.statusCode).toBe(200)
        expect(response.headers['content-type']).toBe('text/html; charset=utf-8')
        expect(response.body).toBe(
          '<!doctype html><head><base href="/app/"><title>Echo</title></head>'
        )
      }
    )

    test('Should tell the page of the frontend that it is served below the base path', async () => {
      const { server } = await buildTestServer({
        config: { server: getMockServerConfig({ frontendDistDirPath, basePath: '/echo' }) },
        files: indexHtmlFiles
      })

      const response = await server.inject('/echo/app/')

      expect(response.body).toContain('<base href="/echo/app/">')
    })

    test('Should serve the other files of the frontend as they are', async () => {
      const { server } = await buildTestServer({
        config: { server: getMockServerConfig({ frontendDistDirPath }) },
        files: indexHtmlFiles
      })

      const response = await server.inject('/app/asset.txt')

      expect(response.statusCode).toBe(200)
      expect(response.body.trim()).toBe('asset content')
    })

    test('Should answer a 404 error to a path that only starts like the one of the frontend', async () => {
      const { server } = await buildTestServer({
        config: { server: getMockServerConfig({ frontendDistDirPath }) },
        files: indexHtmlFiles
      })

      const response = await server.inject('/application')

      expect(response.statusCode).toBe(404)
      expect(response.json()).toEqual({ statusCode: 404, message: 'Not found.' })
    })
  })

  describe('CORS', () => {
    test('Should let a page read the answer when it was loaded from the host the request is sent to', async () => {
      const { server } = await buildTestServer()

      const response = await server.inject({
        url: '/api/logs',
        headers: { host: 'logs.example.com', origin: 'https://logs.example.com' }
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['access-control-allow-origin']).toBe('https://logs.example.com')
      expect(response.headers['access-control-allow-credentials']).toBe('true')
    })

    test.each(['https://elsewhere.example.com', 'not an origin'])(
      'Should refuse a request whose origin is %s, which is not its host',
      async (origin) => {
        const { server } = await buildTestServer()

        const response = await server.inject({
          url: '/api/logs',
          headers: { host: 'logs.example.com', origin }
        })

        expect(response.statusCode).toBe(500)
        expect(response.headers).not.toHaveProperty('access-control-allow-origin')
      }
    )

    test('Should answer a request without origin, which no page sent', async () => {
      const { server } = await buildTestServer()

      const response = await server.inject({
        url: '/api/logs',
        headers: { host: 'logs.example.com' }
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('Proxies', () => {
    const forwardedRequest = {
      url: '/api/logs',
      headers: {
        host: 'internal:4000',
        'x-forwarded-host': 'logs.example.com',
        origin: 'https://logs.example.com'
      }
    }

    test('Should believe the forwarded host of whatever sends the request when the config lists no proxy', async () => {
      const { server } = await buildTestServer()

      const response = await server.inject(forwardedRequest)

      expect(response.statusCode).toBe(200)
    })

    test('Should only believe the forwarded host of the proxies the config lists', async () => {
      const { server } = await buildTestServer({
        config: { server: getMockServerConfig({ trustedProxies: ['10.0.0.1'] }) }
      })

      const proxyResponse = await server.inject({ ...forwardedRequest, remoteAddress: '10.0.0.1' })
      const otherResponse = await server.inject({ ...forwardedRequest, remoteAddress: '10.0.0.2' })

      expect(proxyResponse.statusCode).toBe(200)
      expect(otherResponse.statusCode).toBe(500)
    })
  })

  describe('TLS', () => {
    test('Should serve over HTTPS with the certificate and the key of the config', async () => {
      const tls = { cert: 'certificate', key: 'key' }

      await buildTestServer({ config: { server: getMockServerConfig({ tls }) } })

      expect(Fastify).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ https: tls }))
    })

    test('Should serve over HTTP when the config has no certificate', async () => {
      await buildTestServer()

      expect(Fastify).toHaveBeenCalledExactlyOnceWith(
        expect.not.objectContaining({ https: expect.anything() })
      )
    })
  })
})

describe('startServer', () => {
  const config = getMockBackConfig({
    server: getMockServerConfig({ host: '127.0.0.1', port: 4000, basePath: '/echo' }),
    auth: getInMemoryAuthConfig(),
    selfReports: undefined
  })

  test('Should listen on the host and port of the config and say which paths it serves', async () => {
    loadBackConfig.mockResolvedValue(config)
    fastifyStubs.listen.mockResolvedValue('http://127.0.0.1:4000')

    await startServer()

    expect(fastifyStubs.listen).toHaveBeenCalledExactlyOnceWith({ port: 4000, host: '127.0.0.1' })
    expect(fastifyStubs.logInfo).toHaveBeenCalledWith('Api is served under /echo/api')
    expect(fastifyStubs.logInfo).toHaveBeenCalledWith('App is served under /echo/app')
  })

  test('Should exit the process when the config cannot be loaded', async () => {
    const error = new Error('Missing required environment variable: HTTP_PORT')
    loadBackConfig.mockRejectedValue(error)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    await startServer()

    expect(consoleError).toHaveBeenCalledWith('The server could not be built:', error)
    expect(exit).toHaveBeenCalledExactlyOnceWith(1)
    expect(fastifyStubs.listen).not.toHaveBeenCalled()
  })

  test('Should exit the process when the server cannot be built', async () => {
    const error = new Error('The routes could not be registered.')
    moduleStubs.logsRoutesError = error
    loadBackConfig.mockResolvedValue(config)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    await startServer()

    expect(consoleError).toHaveBeenCalledWith('The server could not be built:', error)
    expect(exit).toHaveBeenCalledExactlyOnceWith(1)
    expect(fastifyStubs.listen).not.toHaveBeenCalled()
  })

  test('Should log the error and exit the process when the server cannot listen', async () => {
    const error = Object.assign(new Error('listen EADDRINUSE'), { code: 'EADDRINUSE' })
    loadBackConfig.mockResolvedValue(config)
    fastifyStubs.listen.mockRejectedValue(error)
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    await startServer()

    expect(fastifyStubs.logError).toHaveBeenCalledWith(error)
    expect(exit).toHaveBeenCalledExactlyOnceWith(1)
  })
})
