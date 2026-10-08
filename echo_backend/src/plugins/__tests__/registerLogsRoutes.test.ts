import fastifyJwt from '@fastify/jwt'
import Fastify, { type FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LogsRepository } from '../../modules/logs/domain/logs.repository.js'
import { EchoErrorJsonSchema } from '../../shared/schemas/errors.schemas.js'
import {
  getMockAuthConfig,
  getMockBackConfig,
  getMockServerConfig
} from '../../test/mocks/configs.js'
import { registerLogsRoutes } from '../registerLogsRoutes.js'

const LOGS_URL = '/custom-api/logs?fromDate=2026-01-01T00:00:00.000Z'

describe('registerLogsRoutes', () => {
  let server: FastifyInstance
  let logsRepository: LogsRepository

  /** Registers the routes of the logs on `server`, with authentication enabled or not. */
  const registerRoutes = (hasAuthentication: boolean): Promise<void> =>
    registerLogsRoutes(
      server,
      getMockBackConfig({
        server: getMockServerConfig({ apiRoutePrefix: '/custom-api' }),
        auth: getMockAuthConfig({ hasAuthentication })
      }),
      logsRepository
    )

  beforeEach(async () => {
    logsRepository = { findAllLogs: vi.fn().mockResolvedValue([]) }
    server = Fastify()
    server.addSchema(EchoErrorJsonSchema)
    await server.register(fastifyJwt, { secret: 'test-secret' })
  })

  afterEach(async () => {
    await server.close()
  })

  it('should serve the logs of the repository under the API prefix', async () => {
    await registerRoutes(false)

    const response = await server.inject({ method: 'GET', url: LOGS_URL })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
    expect(logsRepository.findAllLogs).toHaveBeenCalledTimes(1)
  })

  it('should reject a request without valid JWT when authentication is enabled', async () => {
    await registerRoutes(true)

    const response = await server.inject({ method: 'GET', url: LOGS_URL })

    expect(response.statusCode).toBe(401)
    expect(logsRepository.findAllLogs).not.toHaveBeenCalled()
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
