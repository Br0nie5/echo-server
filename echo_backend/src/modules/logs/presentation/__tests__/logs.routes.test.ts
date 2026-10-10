import type { FastifyInstance } from 'fastify'
import type { Mock } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { LogsController } from '../logs.controller.js'
import { logsRoutes } from '../logs.routes.js'
import { GetLogsParamsJsonSchema, LogJsonSchema, LogCategoryJsonSchema } from '../logs.schemas.js'

const controller = { getLogs: vi.fn() } as unknown as LogsController

describe('logsRoutes', () => {
  interface MockServerType {
    addSchema: Mock
    route: Mock
  }
  let mockServer: MockServerType

  beforeEach(() => {
    mockServer = {
      addSchema: vi.fn(),
      route: vi.fn()
    }
  })

  it('Should run the given preHandler before the handler of the route', async () => {
    const preHandler = vi.fn()

    await logsRoutes(mockServer as unknown as FastifyInstance, { controller, preHandler })

    expect(mockServer.route.mock.calls[0][0].preHandler).toBe(preHandler)
  })

  it('Should set no preHandler when none is given', async () => {
    await logsRoutes(mockServer as unknown as FastifyInstance, { controller })

    expect(mockServer.route.mock.calls[0][0]).not.toHaveProperty('preHandler')
  })

  it('Should register schemas and /logs route correctly', async () => {
    await logsRoutes(mockServer as unknown as FastifyInstance, { controller })

    // Check schemas were added
    expect(mockServer.addSchema).toHaveBeenCalledWith(LogCategoryJsonSchema)
    expect(mockServer.addSchema).toHaveBeenCalledWith(LogJsonSchema)

    // Check route registration
    expect(mockServer.route).toHaveBeenCalledTimes(1)
    const routeConfig = mockServer.route.mock.calls[0][0]

    expect(routeConfig.method).toBe('GET')
    expect(routeConfig.url).toBe('/logs')
    expect(routeConfig.handler).toBe(controller.getLogs)

    // Check querystring schema
    expect(routeConfig.schema.querystring).toBe(GetLogsParamsJsonSchema)

    // Check response schemas
    expect(routeConfig.schema.response[200]).toEqual({
      type: 'array',
      description: 'Returned Logs successfully.',
      items: { $ref: 'Log#' }
    })
    expect(routeConfig.schema.response[400]).toEqual({
      $ref: 'EchoError#',
      description: 'Request is invalid and cannot be processed.'
    })
    expect(routeConfig.schema.response[401]).toEqual({
      $ref: 'EchoError#',
      description: 'Unauthorized, user needs to be authenticated.'
    })
    expect(routeConfig.schema.response[500]).toEqual({
      $ref: 'EchoError#',
      description: 'An internal server error occurred while handling the request.'
    })

    // Check tags
    expect(routeConfig.schema.tags).toContain('Logs')
  })
})
