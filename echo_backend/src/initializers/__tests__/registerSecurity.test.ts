import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'

import type { BackConfig } from '../../shared/config/backConfig.js'
import { createCookieSerializeOptions } from '../../shared/config/utils/createCookieSerializeOptions.js'
import { getMockAuthConfig, getMockBackConfig } from '../../test/mocks/mockConfigs.js'
import { registerSecurity } from '../registerSecurity.js'

const COOKIE_NAME = 'session-cookie'

const REQUEST_HOST = 'echo.domain.com'

const getConfig = ({
  hasAuthentication = false
}: { hasAuthentication?: boolean } = {}): BackConfig =>
  getMockBackConfig({
    auth: hasAuthentication ? getMockAuthConfig({ cookieName: COOKIE_NAME }) : undefined
  })

describe('registerSecurity', () => {
  let server: FastifyInstance

  /** Builds a server secured for `config`, created with `serverOptions`, with a route answering to anyone. */
  const buildSecuredServer = async (
    config: BackConfig,
    serverOptions: FastifyServerOptions = {}
  ): Promise<FastifyInstance> => {
    server = Fastify(serverOptions)
    await registerSecurity(server, config)
    server.get('/ping', async () => ({ pong: true }))
    return server
  }

  afterEach(async () => {
    await server.close()
  })

  describe('when authentication is enabled', () => {
    it('Should verify the JWT held by the session cookie', async () => {
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

    it('Should sign JWTs that expire with the session', async () => {
      await buildSecuredServer(getConfig({ hasAuthentication: true }))
      await server.ready()

      const { iat, exp } = server.jwt.decode<{ iat: number; exp: number }>(
        server.jwt.sign({ username: 'admin' })
      )!

      expect(exp - iat).toBe(getMockAuthConfig().sessionDurationSeconds)
    })

    it('Should reject a request without session cookie', async () => {
      await buildSecuredServer(getConfig({ hasAuthentication: true }))
      server.get('/session', async (request) => request.jwtVerify())

      const response = await server.inject({ method: 'GET', url: '/session' })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('session cookie', () => {
    /** Asks a server trusting its proxy to set the session cookie, for a request the proxy received over `forwardedProtocol`. */
    const requestSessionCookie = async (forwardedProtocol: string): Promise<string> => {
      await buildSecuredServer(getConfig({ hasAuthentication: true }), { trustProxy: true })
      server.get('/open-session', async (_request, reply) =>
        reply.setCookie(COOKIE_NAME, 'token', createCookieSerializeOptions('', 60)).send()
      )

      const response = await server.inject({
        method: 'GET',
        url: '/open-session',
        headers: { 'x-forwarded-proto': forwardedProtocol }
      })

      return String(response.headers['set-cookie'])
    }

    it('Should be secure when the browser reached the trusted proxy over HTTPS', async () => {
      expect(await requestSessionCookie('https')).toContain('; Secure')
    })

    it('Should not be secure when the browser reached the trusted proxy over HTTP', async () => {
      expect(await requestSessionCookie('http')).not.toContain('; Secure')
    })
  })

  describe('when authentication is disabled', () => {
    it('Should register neither the JWT nor the cookie support', async () => {
      await buildSecuredServer(getConfig({ hasAuthentication: false }))
      await server.ready()

      expect(server.hasDecorator('jwt')).toBe(false)
      expect(server.hasReplyDecorator('setCookie')).toBe(false)
    })
  })

  describe('CORS', () => {
    it('Should accept a request without origin', async () => {
      await buildSecuredServer(getConfig())

      const response = await server.inject({ method: 'GET', url: '/ping' })

      expect(response.statusCode).toBe(200)
    })

    it('Should allow the origin the request is sent to, with its credentials', async () => {
      await buildSecuredServer(getConfig())
      const origin = `https://${REQUEST_HOST}`

      const response = await server.inject({
        method: 'POST',
        url: '/ping',
        headers: { origin, host: REQUEST_HOST }
      })

      expect(response.headers['access-control-allow-origin']).toBe(origin)
      expect(response.headers['access-control-allow-credentials']).toBe('true')
    })

    it.each(['https://other-domain.com', `https://logs.${REQUEST_HOST}`])(
      'Should reject the other origin %s',
      async (origin) => {
        await buildSecuredServer(getConfig())

        const response = await server.inject({
          method: 'GET',
          url: '/ping',
          headers: { origin, host: REQUEST_HOST }
        })

        expect(response.statusCode).toBe(500)
        expect(response.json().message).toBe(
          `Not allowed by CORS: ${origin} (Allowed: ${REQUEST_HOST})`
        )
        expect(response.headers['access-control-allow-origin']).toBeUndefined()
      }
    )

    it('Should allow the origin a trusted proxy says the request was sent to', async () => {
      await buildSecuredServer(getConfig(), { trustProxy: true })
      const origin = `https://${REQUEST_HOST}`

      const response = await server.inject({
        method: 'POST',
        url: '/ping',
        headers: { origin, host: 'echo:4000', 'x-forwarded-host': REQUEST_HOST }
      })

      expect(response.headers['access-control-allow-origin']).toBe(origin)
    })

    it('Should not believe the forwarded host when its sender is not one of the trusted proxies', async () => {
      await buildSecuredServer(getConfig(), { trustProxy: ['10.0.0.1'] })

      const response = await server.inject({
        method: 'POST',
        url: '/ping',
        headers: {
          origin: `https://${REQUEST_HOST}`,
          host: 'echo:4000',
          'x-forwarded-host': REQUEST_HOST
        }
      })

      expect(response.statusCode).toBe(500)
    })

    it('Should reject an origin that is not a URL', async () => {
      await buildSecuredServer(getConfig())

      const response = await server.inject({
        method: 'GET',
        url: '/ping',
        headers: { origin: 'not a url' }
      })

      expect(response.statusCode).toBe(500)
      expect(response.json().message).toBe('Invalid Origin Header')
    })

    it('Should announce the allowed methods and headers to a preflight request', async () => {
      await buildSecuredServer(getConfig())

      const response = await server.inject({
        method: 'OPTIONS',
        url: '/ping',
        headers: {
          origin: `https://${REQUEST_HOST}`,
          host: REQUEST_HOST,
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
