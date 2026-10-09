import net from 'net'

import type * as FastifyModule from 'fastify'
import Fastify, { type FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../plugins/registerAuthRoutes.js')
vi.mock('../plugins/registerDocumentation.js')
vi.mock('../plugins/registerFrontend.js')
vi.mock('../plugins/registerLogsNotifier.js')
vi.mock('../plugins/registerLogsRoutes.js')
vi.mock('../plugins/registerSecurity.js')
vi.mock('../plugins/utils/getSelfReportRepository.js')
vi.mock('../shared/config/loadBackConfig.js')
// The server is created without the options `buildServer` asks for: its logger would write to the
// output of the tests, and the TLS certificate of the tests is not a real one, which the HTTPS
// server of Node refuses. The mock also gives the tests the instance `startServer` builds, which
// it does not return.
vi.mock('fastify', async (importOriginal) => {
  const actual = await importOriginal<typeof FastifyModule>()

  return { ...actual, default: vi.fn(() => actual.default()) }
})

import type { SelfReportRepository } from '../modules/selfReport/domain/selfReport.repository.js'
import { registerAuthRoutes } from '../plugins/registerAuthRoutes.js'
import { registerDocumentation } from '../plugins/registerDocumentation.js'
import { registerFrontend } from '../plugins/registerFrontend.js'
import { registerLogsNotifier } from '../plugins/registerLogsNotifier.js'
import { registerLogsRoutes } from '../plugins/registerLogsRoutes.js'
import { registerSecurity } from '../plugins/registerSecurity.js'
import { getSelfReportRepository as actualGetSelfReportRepository } from '../plugins/utils/getSelfReportRepository.js'
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
} from '../test/mocks/configs.js'

const loadBackConfig = vi.mocked(actualLoadBackConfig)
const getSelfReportRepository = vi.mocked(actualGetSelfReportRepository)

const selfReportRepository: SelfReportRepository = { saveSelfReports: vi.fn() }

/** A config with every optional part set: TLS, authentication, logs notifier and notifications. */
const getFullConfig = (): BackConfig =>
  getMockBackConfig({
    server: getMockServerConfig({
      host: '127.0.0.1',
      port: 0,
      tls: { cert: Buffer.from('certificate'), key: Buffer.from('key') }
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
    getSelfReportRepository.mockResolvedValue(selfReportRepository)
    servers = []
  })

  afterEach(async () => {
    await Promise.all(servers.map((server) => server.close()))
    vi.restoreAllMocks()
  })

  describe('buildServer', () => {
    it('should register every part of the server once, the routes after what they rely on', async () => {
      const config = getFullConfig()

      const server = await buildServer(config)
      servers.push(server)

      expect(Fastify).toHaveBeenCalledWith({ logger: true, https: config.server.tls })
      expect(registerSecurity).toHaveBeenCalledExactlyOnceWith(server, config)
      expect(registerDocumentation).toHaveBeenCalledExactlyOnceWith(server, config.server)
      expect(getSelfReportRepository).toHaveBeenCalledExactlyOnceWith(
        server,
        expect.anything(),
        config.selfReports,
        expect.any(Function)
      )
      expect(getSelfReportRepository.mock.calls[0][3](getMockSelfReportsConfig())).toBe(
        getMockSelfReportsConfig().parseLogFileSelfReportFileName
      )
      expect(registerAuthRoutes).toHaveBeenCalledExactlyOnceWith(server, config)
      expect(registerLogsRoutes).toHaveBeenCalledExactlyOnceWith(
        server,
        config,
        expect.anything(),
        selfReportRepository
      )
      expect(registerFrontend).toHaveBeenCalledExactlyOnceWith(server, config.server)
      expect(registerLogsNotifier).toHaveBeenCalledExactlyOnceWith(server, config, {
        logsRepository: expect.anything(),
        selfReportRepository
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

    it('should answer a generic 500 when a route handler throws', async () => {
      const server = await buildServer(getFullConfig())
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
    it('should listen on the host and port of the config and say where it is reached', async () => {
      const config = getMockBackConfig({
        server: getMockServerConfig({ host: '127.0.0.1', port: 0 })
      })
      loadBackConfig.mockReturnValue(config)
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

      await startServer()
      const server = getBuiltServer()

      expect(server.server.listening).toBe(true)
      expect(server.server.address()).toMatchObject({ address: '127.0.0.1' })
      expect(consoleLog).toHaveBeenCalledWith(`Api is accessible though ${config.server.apiUrl}`)
      expect(consoleLog).toHaveBeenCalledWith(`App is accessible though ${config.server.appUrl}`)
    })

    it('should exit the process when the server cannot listen', async () => {
      const portHolder = net.createServer()
      await new Promise<void>((resolve) => portHolder.listen(0, '127.0.0.1', resolve))
      loadBackConfig.mockReturnValue(
        getMockBackConfig({
          server: getMockServerConfig({
            host: '127.0.0.1',
            port: (portHolder.address() as net.AddressInfo).port
          })
        })
      )
      const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await startServer()
      getBuiltServer()
      await new Promise((resolve) => portHolder.close(resolve))

      expect(exit).toHaveBeenCalledWith(1)
    })
  })
})
