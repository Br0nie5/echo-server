import type { IncomingMessage } from 'http'

import type * as FastifyModule from 'fastify'
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

vi.mock('../initializers/registerAuthRoutes.js')
vi.mock('../initializers/registerDocumentation.js')
vi.mock('../initializers/registerFrontend.js')
vi.mock('../initializers/registerLogsNotifier.js')
vi.mock('../initializers/registerLogsRoutes.js')
vi.mock('../initializers/registerSecurity.js')
vi.mock('../modules/selfReport/infra/selfReport.repository.js')
vi.mock('../shared/config/loadBackConfig.js')
// The server is created without the options `buildServer` asks for: its logger would write to the
// output of the tests, and the TLS certificate of the tests is not a real one, which the HTTPS
// server of Node refuses. The mock also gives the tests the instance `startServer` builds, which
// it does not return.
vi.mock('fastify', async (importOriginal) => {
  const actual = await importOriginal<typeof FastifyModule>()

  return { ...actual, default: vi.fn(() => actual.default()) }
})

import { registerAuthRoutes } from '../initializers/registerAuthRoutes.js'
import { registerDocumentation } from '../initializers/registerDocumentation.js'
import { registerFrontend } from '../initializers/registerFrontend.js'
import { registerLogsNotifier } from '../initializers/registerLogsNotifier.js'
import { registerLogsRoutes } from '../initializers/registerLogsRoutes.js'
import { registerSecurity } from '../initializers/registerSecurity.js'
import type { SelfReportRepository } from '../modules/selfReport/domain/selfReport.repository.js'
import { createSelfReportRepository as actualCreateSelfReportRepository } from '../modules/selfReport/infra/selfReport.repository.js'
import { buildServer, startServer } from '../server.js'
import type { BackConfig } from '../shared/config/backConfig.js'
import { loadBackConfig as actualLoadBackConfig } from '../shared/config/loadBackConfig.js'
import {
  getMockBackConfig,
  getMockLogsConfig,
  getMockLogsNotifierConfig,
  getMockNotificationConfig,
  getMockSelfReportsConfig,
  getMockServerConfig
} from '../test/mocks/mockConfigs.js'
import { getMockFilesService } from '../test/mocks/mockFilesService.js'

const loadBackConfig = vi.mocked(actualLoadBackConfig)
const createSelfReportRepository = vi.mocked(actualCreateSelfReportRepository)

const selfReportRepository: SelfReportRepository = { saveSelfReports: vi.fn() }
const filesService = getMockFilesService()

/** A config with every optional part set: TLS, authentication, logs notifier and notifications. */
const getFullConfig = (): BackConfig =>
  getMockBackConfig({
    server: getMockServerConfig({
      host: '127.0.0.1',
      port: 0,
      tls: { cert: 'certificate', key: 'key' }
    }),
    logs: getMockLogsConfig({ logsNotifier: getMockLogsNotifierConfig() }),
    notification: getMockNotificationConfig()
  })

describe('server', () => {
  let servers: FastifyInstance[]

  /** The server built last. */
  const getBuiltServer = (): FastifyInstance => {
    const server = vi.mocked(Fastify).mock.results.at(-1)?.value as FastifyInstance
    servers.push(server)
    return server
  }

  beforeEach(() => {
    vi.clearAllMocks()
    createSelfReportRepository.mockResolvedValue(selfReportRepository)
    servers = []
  })

  afterEach(async () => {
    await Promise.all(servers.map((server) => server.close()))
    vi.restoreAllMocks()
  })

  describe('buildServer', () => {
    it('Should register every part of the server once, the routes after what they rely on', async () => {
      const config = getFullConfig()

      const server = await buildServer(config, filesService)
      servers.push(server)

      expect(Fastify).toHaveBeenCalledWith({
        logger: true,
        rewriteUrl: expect.any(Function),
        https: config.server.tls
      })
      expect(registerSecurity).toHaveBeenCalledExactlyOnceWith(server, config)
      expect(registerDocumentation).toHaveBeenCalledExactlyOnceWith(server, config.server)
      expect(createSelfReportRepository).toHaveBeenCalledExactlyOnceWith({
        logsRepository: expect.anything(),
        filesService,
        selfReportsConfig: config.selfReports,
        getSelfReportFileName: expect.any(Function),
        logger: server.log
      })
      expect(
        createSelfReportRepository.mock.calls[0][0].getSelfReportFileName(
          getMockSelfReportsConfig()
        )
      ).toBe(getMockSelfReportsConfig().parseLogFileSelfReportFileName)
      expect(registerAuthRoutes).toHaveBeenCalledExactlyOnceWith(server, config, filesService)
      expect(registerLogsRoutes).toHaveBeenCalledExactlyOnceWith(
        server,
        config,
        expect.anything(),
        selfReportRepository
      )
      expect(registerFrontend).toHaveBeenCalledExactlyOnceWith(server, config.server, filesService)
      expect(registerLogsNotifier).toHaveBeenCalledExactlyOnceWith(server, config, {
        logsRepository: expect.anything(),
        selfReportRepository,
        filesService
      })
      expect(server.getSchema('EchoError')).toBeDefined()

      const [securityOrder, documentationOrder, authRoutesOrder, logsRoutesOrder] = [
        registerSecurity,
        registerDocumentation,
        registerAuthRoutes,
        registerLogsRoutes
      ].map((register) => vi.mocked(register).mock.invocationCallOrder[0])
      expect(securityOrder).toBeLessThan(authRoutesOrder)
      expect(documentationOrder).toBeLessThan(authRoutesOrder)
      expect(documentationOrder).toBeLessThan(logsRoutesOrder)
    })

    it('Should route a request the same with the base path of the config or without it', async () => {
      const config = getMockBackConfig({ server: getMockServerConfig({ basePath: '/echo' }) })

      servers.push(await buildServer(config, filesService))

      const { rewriteUrl } = vi.mocked(Fastify).mock.calls[0][0] as FastifyServerOptions
      const rewriteRequestUrl = (url?: string): string | undefined =>
        rewriteUrl?.call(servers[0], { url } as IncomingMessage)

      expect(rewriteRequestUrl('/echo/api/logs?fromDate=2026')).toBe('/api/logs?fromDate=2026')
      expect(rewriteRequestUrl('/api/logs')).toBe('/api/logs')
      expect(rewriteRequestUrl(undefined)).toBe('/')
    })

    it('Should send a redirection to a path of the server below the base path', async () => {
      const config = getMockBackConfig({ server: getMockServerConfig({ basePath: '/echo' }) })
      const server = await buildServer(config, filesService)
      servers.push(server)
      server.get('/documentation/static/index.html', async (_request, reply) =>
        reply.redirect('/documentation/')
      )
      server.get('/elsewhere', async (_request, reply) => reply.redirect('https://domain.com/'))

      const documentationResponse = await server.inject({
        method: 'GET',
        url: '/documentation/static/index.html'
      })
      const elsewhereResponse = await server.inject({ method: 'GET', url: '/elsewhere' })

      expect(documentationResponse.headers.location).toBe('/echo/documentation/')
      expect(elsewhereResponse.headers.location).toBe('https://domain.com/')
    })

    it('Should answer a generic 500 when a route handler throws', async () => {
      const server = await buildServer(getFullConfig(), filesService)
      servers.push(server)
      server.get('/failing', async () => {
        throw new Error('internal detail')
      })

      const response = await server.inject({ method: 'GET', url: '/failing' })

      expect(response.statusCode).toBe(500)
      expect(response.json()).toEqual({
        statusCode: 500,
        message: 'An unexpected error occurred.'
      })
    })
  })

  describe('startServer', () => {
    /**
     * Makes the next server built record what it logs, and answer `listen` with `listen` instead of
     * opening a port.
     */
    const stubNextServer = async (
      listen: () => Promise<string>
    ): Promise<{ listen: Mock; logInfo: Mock; logError: Mock }> => {
      const { default: actualFastify } = await vi.importActual<typeof FastifyModule>('fastify')
      const stubs = { listen: vi.fn(listen), logInfo: vi.fn(), logError: vi.fn() }

      vi.mocked(Fastify).mockImplementationOnce((() => {
        const server = actualFastify()
        vi.spyOn(server, 'listen').mockImplementation(stubs.listen as FastifyInstance['listen'])
        vi.spyOn(server.log, 'info').mockImplementation(stubs.logInfo)
        vi.spyOn(server.log, 'error').mockImplementation(stubs.logError)
        return server
      }) as unknown as typeof Fastify)

      return stubs
    }

    it('Should listen on the host and port of the config and say where it is reached', async () => {
      const config = getMockBackConfig({
        server: getMockServerConfig({ host: '127.0.0.1', port: 4000 })
      })
      loadBackConfig.mockResolvedValue(config)
      const { listen, logInfo } = await stubNextServer(async () => 'http://127.0.0.1:4000')

      await startServer()
      getBuiltServer()

      expect(listen).toHaveBeenCalledExactlyOnceWith({ port: 4000, host: '127.0.0.1' })
      expect(logInfo).toHaveBeenCalledWith(`Api is accessible through ${config.server.apiUrl}`)
      expect(logInfo).toHaveBeenCalledWith(`App is accessible through ${config.server.appUrl}`)
    })

    it('Should exit the process when the config cannot be loaded', async () => {
      const error = new Error('Missing required environment variable: HTTP_PORT')
      loadBackConfig.mockRejectedValue(error)
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await startServer()

      expect(consoleError).toHaveBeenCalledWith('The server could not be built:', error)
      expect(exit).toHaveBeenCalledWith(1)
    })

    it('Should exit the process when the server cannot be built', async () => {
      loadBackConfig.mockResolvedValue(getFullConfig())
      vi.mocked(registerSecurity).mockRejectedValueOnce(new Error('plugin failure'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await startServer()
      getBuiltServer()

      expect(exit).toHaveBeenCalledWith(1)
    })

    it('Should log the error and exit the process when the server cannot listen', async () => {
      const error = Object.assign(new Error('listen EADDRINUSE'), { code: 'EADDRINUSE' })
      loadBackConfig.mockResolvedValue(getMockBackConfig())
      const { logError } = await stubNextServer(() => Promise.reject(error))
      const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await startServer()
      getBuiltServer()

      expect(logError).toHaveBeenCalledWith(error)
      expect(exit).toHaveBeenCalledWith(1)
    })
  })
})
