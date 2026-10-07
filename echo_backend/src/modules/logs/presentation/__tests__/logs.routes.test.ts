import type { FastifyInstance } from 'fastify'
import type { Mock } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { requireAuthentication } from '../../../auth/auth.hooks.js'
import type { LogsController } from '../logs.controller.js'
import { logsRoutes } from '../logs.routes.js'
import {
  GetLogsParamsQuerySchema,
  LogQuerySchema,
  LogCategoryQuerySchema
} from '../logs.schemas.js'

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

  it.each([
    [true, requireAuthentication],
    [false, undefined]
  ])('should set preHandler when HAS_AUTHENTICATION is %s', async (hasAuth, expected) => {
    await logsRoutes(mockServer as unknown as FastifyInstance, {
      controller,
      hasAuthentication: hasAuth
    })

    expect(mockServer.route.mock.calls[0][0].preHandler).toBe(expected)
  })

  it('should register schemas and /logs route correctly', async () => {
    await logsRoutes(mockServer as unknown as FastifyInstance, {
      controller,
      hasAuthentication: true
    })

    // Check schemas were added
    expect(mockServer.addSchema).toHaveBeenCalledWith(LogCategoryQuerySchema)
    expect(mockServer.addSchema).toHaveBeenCalledWith(LogQuerySchema)

    // Check route registration
    expect(mockServer.route).toHaveBeenCalledTimes(1)
    const routeConfig = mockServer.route.mock.calls[0][0]

    expect(routeConfig.method).toBe('GET')
    expect(routeConfig.url).toBe('/logs')
    expect(routeConfig.handler).toBe(controller.getLogs)

    // Check querystring schema
    expect(routeConfig.schema.querystring).toBe(GetLogsParamsQuerySchema)

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
