import type { FastifyInstance } from 'fastify'
import type { Mock } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { getMockAuthConfig } from '../../../../test/mocks/mockConfigs.js'
import type { AuthController } from '../auth.controller.js'
import { authRoutes } from '../auth.routes.js'
import {
  AuthTokenJsonSchema,
  LoginRequestJsonSchema,
  SignUpRequestJsonSchema
} from '../auth.schemas.js'

// Schemas are mocked to ensure the test only validates route registration
vi.mock('../auth.schemas.js', () => ({
  AuthTokenJsonSchema: {
    $id: 'AuthToken',
    type: 'object',
    properties: { success: { type: 'boolean' } }
  },
  LoginRequestJsonSchema: {
    $id: 'LoginRequest',
    type: 'object',
    properties: { username: { type: 'string' } }
  },
  SignUpRequestJsonSchema: {
    $id: 'SignUpRequest',
    type: 'object',
    properties: { username: { type: 'string' } }
  }
}))

const authConfig = getMockAuthConfig({
  credentialsAttemptsLimit: { maxAttempts: 5, timeWindowMilliseconds: 60 * 1000 }
})

const controller = {
  signUp: vi.fn(),
  login: vi.fn(),
  check: vi.fn(),
  logout: vi.fn()
} as unknown as AuthController

describe('authRoutes', () => {
  interface MockServerType {
    addSchema: Mock
    route: Mock
  }
  let mockServer: MockServerType

  beforeEach(() => {
    vi.clearAllMocks()
    mockServer = {
      addSchema: vi.fn(),
      route: vi.fn()
    }
  })

  it('Should register schemas and all auth routes correctly', async () => {
    await authRoutes(mockServer as unknown as FastifyInstance, {
      controller,
      authConfig
    })

    // Check schemas were added
    expect(mockServer.addSchema).toHaveBeenCalledWith(AuthTokenJsonSchema)
    expect(mockServer.addSchema).toHaveBeenCalledWith(LoginRequestJsonSchema)
    expect(mockServer.addSchema).toHaveBeenCalledWith(SignUpRequestJsonSchema)
    expect(mockServer.addSchema).toHaveBeenCalledTimes(3)

    // Check that all routes were registered
    expect(mockServer.route).toHaveBeenCalledTimes(4)
  })

  it('Should limit the attempts of the routes receiving credentials only', async () => {
    await authRoutes(mockServer as unknown as FastifyInstance, {
      controller,
      authConfig
    })

    const rateLimitByUrl = Object.fromEntries(
      mockServer.route.mock.calls.map(([route]) => [route.url, route.config?.rateLimit])
    )

    expect(rateLimitByUrl).toEqual({
      '/auth/signup': { max: 5, timeWindow: 60000 },
      '/auth/login': { max: 5, timeWindow: 60000 },
      '/auth/check': undefined,
      '/auth/logout': undefined
    })
  })

  // --- /auth/signup route tests ---
  it('Should register the /auth/signup route with correct schema and handler', async () => {
    await authRoutes(mockServer as unknown as FastifyInstance, {
      controller,
      authConfig
    })

    // Find the signup route call
    const signUpRouteConfig = mockServer.route.mock.calls.find(
      (call: unknown[]) => (call[0] as { url: string }).url === '/auth/signup'
    )?.[0]

    expect(signUpRouteConfig).toBeDefined()
    expect(signUpRouteConfig.method).toBe('POST')
    expect(signUpRouteConfig.url).toBe('/auth/signup')
    expect(signUpRouteConfig.handler).toBe(controller.signUp)

    // Check schema properties
    expect(signUpRouteConfig.schema.operationId).toBe('signUp')
    expect(signUpRouteConfig.schema.body).toEqual({ $ref: 'SignUpRequest#' })
    expect(signUpRouteConfig.schema.tags).toEqual(['Authentication'])
    expect(signUpRouteConfig.schema.summary).toBe('Sign up and set session cookie.')

    // Check response schemas
    expect(signUpRouteConfig.schema.response[200]).toEqual({ $ref: 'AuthToken#' })
    expect(signUpRouteConfig.schema.response[403]).toEqual({ $ref: 'AuthToken#' })
  })

  // --- /auth/login route tests ---
  it('Should register the /auth/login route with correct schema and handler', async () => {
    await authRoutes(mockServer as unknown as FastifyInstance, {
      controller,
      authConfig
    })

    // Find the login route call
    const loginRouteConfig = mockServer.route.mock.calls.find(
      (call: unknown[]) => (call[0] as { url: string }).url === '/auth/login'
    )?.[0]

    expect(loginRouteConfig).toBeDefined()
    expect(loginRouteConfig.method).toBe('POST')
    expect(loginRouteConfig.url).toBe('/auth/login')
    expect(loginRouteConfig.handler).toBe(controller.login)

    // Check schema properties
    expect(loginRouteConfig.schema.operationId).toBe('login')
    expect(loginRouteConfig.schema.body).toEqual({ $ref: 'LoginRequest#' })
    expect(loginRouteConfig.schema.tags).toEqual(['Authentication'])
    expect(loginRouteConfig.schema.summary).toBe('Authenticate and set session cookie.')

    // Check response schemas
    expect(loginRouteConfig.schema.response[200]).toEqual({ $ref: 'AuthToken#' })
    expect(loginRouteConfig.schema.response[401]).toEqual({ $ref: 'AuthToken#' })
  })

  // --- /auth/check route tests ---
  it('Should register the /auth/check route with correct schema and handler', async () => {
    await authRoutes(mockServer as unknown as FastifyInstance, {
      controller,
      authConfig
    })

    // Find the check route call
    const checkRouteConfig = mockServer.route.mock.calls.find(
      (call: unknown[]) => (call[0] as { url: string }).url === '/auth/check'
    )?.[0]

    expect(checkRouteConfig).toBeDefined()
    expect(checkRouteConfig.method).toBe('GET')
    expect(checkRouteConfig.url).toBe('/auth/check')
    expect(checkRouteConfig.handler).toBe(controller.check)

    // Check schema properties
    expect(checkRouteConfig.schema.operationId).toBe('checkAuthStatus')
    expect(checkRouteConfig.schema.tags).toEqual(['Authentication'])
    expect(checkRouteConfig.schema.summary).toBe('Check if authenticated or not.')

    // Check response schemas
    expect(checkRouteConfig.schema.response[200]).toEqual({ $ref: 'AuthToken#' })
    expect(checkRouteConfig.schema.response[401]).toEqual({ $ref: 'AuthToken#' })
  })

  // --- /auth/logout route tests ---
  it('Should register the /auth/logout route with correct schema and handler', async () => {
    await authRoutes(mockServer as unknown as FastifyInstance, {
      controller,
      authConfig
    })

    // Find the logout route call
    const logoutRouteConfig = mockServer.route.mock.calls.find(
      (call: unknown[]) => (call[0] as { url: string }).url === '/auth/logout'
    )?.[0]

    expect(logoutRouteConfig).toBeDefined()
    expect(logoutRouteConfig.method).toBe('POST')
    expect(logoutRouteConfig.url).toBe('/auth/logout')
    expect(logoutRouteConfig.handler).toBe(controller.logout)

    // Check schema properties
    expect(logoutRouteConfig.schema.operationId).toBe('logout')
    expect(logoutRouteConfig.schema.tags).toEqual(['Authentication'])
    expect(logoutRouteConfig.schema.summary).toBe('Clear the session cookie.')

    // Check response schemas
    expect(logoutRouteConfig.schema.response[200]).toEqual({ $ref: 'AuthToken#' })
  })
})
