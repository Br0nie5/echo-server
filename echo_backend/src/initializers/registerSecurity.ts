import * as crypto from 'crypto'

import fastifyCookie from '@fastify/cookie'
import cors, { type FastifyCorsOptions } from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'

import type { BackConfig } from '../shared/config/backConfig.js'

import type { EchoServer } from './types/echoServer.js'
import { isOriginAllowed } from './utils/isOriginAllowed.js'

/** Random secret regenerated at each start, so the sessions do not survive a restart. */
const DYNAMIC_JWT_SECRET = crypto.randomBytes(256).toString('hex')

/** Registers cookie/JWT support when authentication is enabled, the JWT expiring with the session, and CORS restricted to the origins `isOriginAllowed` accepts: the allowed domain, its subdomains and the address the request itself is sent to. */
export const registerSecurity = async (server: EchoServer, config: BackConfig): Promise<void> => {
  const { allowedDomain } = config.server

  if (config.auth) {
    await server.register(fastifyCookie)

    await server.register(fastifyJwt, {
      secret: DYNAMIC_JWT_SECRET,
      // A token outlives neither its cookie nor the server: copied out of the cookie, it is no
      // longer accepted once the session is over.
      sign: { expiresIn: `${config.auth.sessionDurationSeconds}s` },
      cookie: {
        cookieName: config.auth.cookieName,
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
    // given the request: the origin is also compared to the host the request was sent to.
    delegator: (request, callback) => {
      const { origin } = request.headers

      if (!origin) {
        return callback(null, corsOptions)
      }

      try {
        if (isOriginAllowed(origin, { allowedDomain, requestHost: request.host })) {
          return callback(null, corsOptions)
        }

        return callback(new Error(`Not allowed by CORS: ${origin} (Allowed: ${allowedDomain})`))
      } catch {
        return callback(new Error('Invalid Origin Header'))
      }
    }
  })
}
