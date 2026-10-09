import Fastify, { type FastifyInstance } from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'

import type { BackConfig } from '../../shared/config/backConfig.js'
import {
  getMockAuthConfig,
  getMockBackConfig,
  getMockServerConfig
} from '../../test/mocks/configs.js'
import { registerSecurity } from '../registerSecurity.js'

const COOKIE_NAME = 'session-cookie'

const getConfig = ({
  hasAuthentication = false,
  allowedDomain = 'allowed-domain.com'
}: { hasAuthentication?: boolean; allowedDomain?: string } = {}): BackConfig =>
  getMockBackConfig({
    server: getMockServerConfig({ allowedDomain }),
    auth: getMockAuthConfig({ hasAuthentication, cookieName: COOKIE_NAME })
  })

describe('registerSecurity', () => {
  let server: FastifyInstance

  /** Builds a server secured for `config`, with a route answering to anyone. */
  const buildSecuredServer = async (config: BackConfig): Promise<FastifyInstance> => {
    server = Fastify()
    await registerSecurity(server, config)
    server.get('/ping', async () => ({ pong: true }))
    return server
  }

  afterEach(async () => {
    await server.close()
  })

  describe('when authentication is enabled', () => {
    it('should verify the JWT held by the session cookie', async () => {
      await buildSecuredServer(getConfig({ hasAuthentication: true }))
      server.get('/session', async (request) => request.jwtVerify())
      await server.ready()
      const token = server.jwt.sign({ username: 'admin' })

      const response = await server.inject({
        method: 'GET',
        url: '/session',
        cookies: { [COOKIE_NAME]: token }
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({ username: 'admin' })
    })

    it('should reject a request without session cookie', async () => {
      await buildSecuredServer(getConfig({ hasAuthentication: true }))
      server.get('/session', async (request) => request.jwtVerify())

      const response = await server.inject({ method: 'GET', url: '/session' })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('when authentication is disabled', () => {
    it('should register neither the JWT nor the cookie support', async () => {
      await buildSecuredServer(getConfig({ hasAuthentication: false }))
      await server.ready()

      expect(server.hasDecorator('jwt')).toBe(false)
      expect(server.hasReplyDecorator('setCookie')).toBe(false)
    })
  })

  describe('CORS', () => {
    it('should accept a request without origin', async () => {
      await buildSecuredServer(getConfig())

      const response = await server.inject({ method: 'GET', url: '/ping' })

      expect(response.statusCode).toBe(200)
    })

    it('should allow a subdomain of the allowed domain, with its credentials', async () => {
      await buildSecuredServer(getConfig())
      const origin = 'https://logs.allowed-domain.com'

      const response = await server.inject({ method: 'GET', url: '/ping', headers: { origin } })

      expect(response.statusCode).toBe(200)
      expect(response.headers['access-control-allow-origin']).toBe(origin)
      expect(response.headers['access-control-allow-credentials']).toBe('true')
    })

    it('should reject another domain', async () => {
      await buildSecuredServer(getConfig())

      const response = await server.inject({
        method: 'GET',
        url: '/ping',
        headers: { origin: 'https://other-domain.com' }
      })

      expect(response.statusCode).toBe(500)
      expect(response.json().message).toBe(
        'Not allowed by CORS: https://other-domain.com (Allowed: allowed-domain.com)'
      )
    })

    it('should allow the origin the request is sent to, even outside the allowed domain', async () => {
      await buildSecuredServer(getConfig({ allowedDomain: 'localhost' }))
      const origin = 'http://192.168.1.1:4000'

      const response = await server.inject({
        method: 'POST',
        url: '/ping',
        headers: { origin, host: '192.168.1.1:4000' }
      })

      expect(response.headers['access-control-allow-origin']).toBe(origin)
    })

    it('should reject any other origin when the allowed domain is localhost', async () => {
      await buildSecuredServer(getConfig({ allowedDomain: 'localhost' }))

      const response = await server.inject({
        method: 'GET',
        url: '/ping',
        headers: { origin: 'https://other-domain.com', host: '192.168.1.1:4000' }
      })

      expect(response.statusCode).toBe(500)
      expect(response.headers['access-control-allow-origin']).toBeUndefined()
    })

    it('should reject an origin that is not a URL', async () => {
      await buildSecuredServer(getConfig())

      const response = await server.inject({
        method: 'GET',
        url: '/ping',
        headers: { origin: 'not a url' }
      })

      expect(response.statusCode).toBe(500)
      expect(response.json().message).toBe('Invalid Origin Header')
    })

    it('should announce the allowed methods and headers to a preflight request', async () => {
      await buildSecuredServer(getConfig())

      const response = await server.inject({
        method: 'OPTIONS',
        url: '/ping',
        headers: {
          origin: 'https://allowed-domain.com',
          'access-control-request-method': 'GET'
        }
      })

      expect(response.statusCode).toBe(204)
      expect(response.headers['access-control-allow-methods']).toBe('GET, POST, OPTIONS')
      expect(response.headers['access-control-allow-headers']).toBe(
        'Content-Type, Authorization, Accept'
      )
    })
  })
})
