import * as crypto from 'crypto'

import fastifyCookie from '@fastify/cookie'
import cors, { type FastifyCorsOptions } from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'

import type { Settings } from './settings/settings.js'
import type { EchoServer } from './types/echoServer.js'
import { isOriginAllowed } from './utils/isOriginAllowed.js'

/** Random secret regenerated at each start, so the sessions do not survive a restart. */
const DYNAMIC_JWT_SECRET = crypto.randomBytes(256).toString('hex')

/** The error a request sent from another origin is answered with: a 403 `EchoError`. */
const createForbiddenOriginError = (message: string): Error =>
  Object.assign(new Error(message), { statusCode: 403 })

/**
 * Registers cookie/JWT support when authentication is enabled, the JWT expiring with the session,
 * and CORS restricted to the origin `isOriginAllowed` accepts: the one the request itself is sent
 * to. A request carrying another origin, or an `Origin` header that is not a URL, is answered a
 * 403 `EchoError`.
 *
 * That one is the host of the request, which behind a reverse proxy is the one the browser
 * reached only when the proxy forwards it: as the `Host` header, or as `X-Forwarded-Host` when it
 * is one of the `trustedProxies` of the settings, or when the settings have none.
 */
export const registerSecurity = async (
  server: EchoServer,
  { auth: authSettings }: Settings
): Promise<void> => {
  if (authSettings) {
    await server.register(fastifyCookie)

    await server.register(fastifyJwt, {
      secret: DYNAMIC_JWT_SECRET,
      // A token outlives neither its cookie nor the server: copied out of the cookie, it is no
      // longer accepted once the session is over.
      sign: { expiresIn: `${authSettings.config.sessionDurationSeconds}s` },
      cookie: {
        cookieName: authSettings.config.cookieName,
        signed: false // We verify via JWT signature, so the cookie itself doesn't need a secondary signature
      }
    })
  }

  const corsOptions: FastifyCorsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  }

  await server.register(cors, {
    // The options are decided per request, and not by the `origin` option alone, which is not
    // given the request: the origin is compared to the host the request was sent to.
    delegator: (request, callback) => {
      const { origin } = request.headers

      if (!origin) {
        return callback(null, corsOptions)
      }

      try {
        if (isOriginAllowed(origin, request.host)) {
          return callback(null, corsOptions)
        }

        return callback(
          createForbiddenOriginError(`Not allowed by CORS: ${origin} (Allowed: ${request.host})`)
        )
      } catch {
        return callback(createForbiddenOriginError('Invalid Origin Header'))
      }
    }
  })
}
