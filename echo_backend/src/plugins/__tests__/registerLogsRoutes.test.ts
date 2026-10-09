import fastifyJwt from '@fastify/jwt'
import Fastify, { type FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LogsRepository } from '../../modules/logs/domain/logs.repository.js'
import type { SelfReport } from '../../modules/selfReport/domain/selfReport.js'
import type { SelfReportRepository } from '../../modules/selfReport/domain/selfReport.repository.js'
import { EchoErrorJsonSchema } from '../../shared/schemas/errors.schemas.js'
import {
  getMockAuthConfig,
  getMockBackConfig,
  getMockServerConfig
} from '../../test/mocks/configs.js'
import { registerLogsRoutes } from '../registerLogsRoutes.js'

const LOGS_URL = '/custom-api/logs?fromDate=2026-01-01T00:00:00.000Z'

const selfReports: SelfReport[] = [
  {
    date: new Date('2026-09-19T14:41:09.669Z'),
    message: 'invalid line',
    level: 'warning',
    reportedFile: 'backup',
    reportedLine: 2
  }
]

describe('registerLogsRoutes', () => {
  let server: FastifyInstance
  let logsRepository: LogsRepository
  let selfReportRepository: SelfReportRepository

  /** Registers the routes of the logs on `server`, with authentication enabled or not. */
  const registerRoutes = (hasAuthentication: boolean): Promise<void> =>
    registerLogsRoutes(
      server,
      getMockBackConfig({
        server: getMockServerConfig({ apiRoutePrefix: '/custom-api' }),
        auth: getMockAuthConfig({ hasAuthentication })
      }),
      logsRepository,
      selfReportRepository
    )

  beforeEach(async () => {
    logsRepository = {
      getAllLogs: vi.fn().mockResolvedValue({ logs: [], selfReports }),
      getLogs: vi.fn(),
      saveLogs: vi.fn(),
      deleteLogs: vi.fn()
    }
    selfReportRepository = { saveSelfReports: vi.fn() }
    server = Fastify()
    server.addSchema(EchoErrorJsonSchema)
    await server.register(fastifyJwt, { secret: 'test-secret' })
  })

  afterEach(async () => {
    await server.close()
  })

  it('should serve the logs of the repository under the API prefix, and save its self reports', async () => {
    await registerRoutes(false)

    const response = await server.inject({ method: 'GET', url: LOGS_URL })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
    expect(logsRepository.getAllLogs).toHaveBeenCalledTimes(1)
    expect(selfReportRepository.saveSelfReports).toHaveBeenCalledExactlyOnceWith(selfReports)
  })

  it('should reject a request without valid JWT when authentication is enabled', async () => {
    await registerRoutes(true)

    const response = await server.inject({ method: 'GET', url: LOGS_URL })

    expect(response.statusCode).toBe(401)
    expect(logsRepository.getAllLogs).not.toHaveBeenCalled()
  })

  it('should serve the logs to a request with a valid JWT when authentication is enabled', async () => {
    await registerRoutes(true)
    await server.ready()

    const response = await server.inject({
      method: 'GET',
      url: LOGS_URL,
      headers: { authorization: `Bearer ${server.jwt.sign({ username: 'admin' })}` }
    })

    expect(response.statusCode).toBe(200)
  })
})
