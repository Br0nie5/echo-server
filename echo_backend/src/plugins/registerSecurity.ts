import * as crypto from 'crypto'

import fastifyCookie from '@fastify/cookie'
import cors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'

import type { BackConfig } from '../shared/config/backConfig.js'

import type { EchoServer } from './types/echoServer.js'
import { isOriginAllowed } from './utils/isOriginAllowed.js'

/** Random secret regenerated at each start, so the sessions do not survive a restart. */
const DYNAMIC_JWT_SECRET = crypto.randomBytes(256).toString('hex')

/** Registers cookie/JWT support when authentication is enabled, and CORS restricted to the allowed domain and its subdomains. */
export const registerSecurity = async (server: EchoServer, config: BackConfig): Promise<void> => {
  const { allowedDomain } = config.server

  if (config.auth.hasAuthentication) {
    await server.register(fastifyCookie)

    await server.register(fastifyJwt, {
      secret: DYNAMIC_JWT_SECRET,
      cookie: {
        cookieName: config.auth.cookieName,
        signed: false // We verify via JWT signature, so the cookie itself doesn't need a secondary signature
      }
    })
  }

  await server.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true)
      }

      try {
        if (isOriginAllowed(origin, allowedDomain)) {
          return callback(null, true)
        }

        return callback(
          new Error(`Not allowed by CORS: ${origin} (Allowed: ${allowedDomain})`),
          false
        )
      } catch {
        return callback(new Error('Invalid Origin Header'), false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  })
}
