import type { AuthToken, LoginRequest, SignUpRequest } from '@echo/utilities'
import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify'

import type { AuthConfig } from '../../../shared/config/backConfig.js'

import type { AuthController } from './auth.controller.js'
import {
  AuthTokenJsonSchema,
  LoginRequestJsonSchema,
  SignUpRequestJsonSchema
} from './auth.schemas.js'

/** Options of the `authRoutes` plugin. */
export interface AuthRoutesOptions extends FastifyPluginOptions {
  controller: AuthController
  /** Gives how many times the routes receiving credentials may be called from one address. */
  authConfig: AuthConfig
}

/**
 * Registers the `/auth/*` routes, and the schemas of `auth.schemas.ts` they refer to.
 *
 * The routes receiving credentials, the sign up and the login, answer a 429 once the
 * `credentialsAttemptsLimit` of `authConfig` is reached, when `@fastify/rate-limit` is registered on the server.
 */
export const authRoutes: FastifyPluginAsync<AuthRoutesOptions> = async (
  server: FastifyInstance,
  {
    controller,
    authConfig: {
      credentialsAttemptsLimit: { maxAttempts, timeWindowMilliseconds }
    }
  }
): Promise<void> => {
  const credentialsRateLimit = { max: maxAttempts, timeWindow: timeWindowMilliseconds }

  server.addSchema(AuthTokenJsonSchema)
  server.addSchema(LoginRequestJsonSchema)
  server.addSchema(SignUpRequestJsonSchema)

  server.route<{ Body: SignUpRequest; Reply: AuthToken }>({
    method: 'POST',
    url: '/auth/signup',
    schema: {
      operationId: 'signUp',
      body: { $ref: 'SignUpRequest#' },
      response: {
        200: { $ref: 'AuthToken#' },
        403: { $ref: 'AuthToken#' },
        429: { description: 'Too many attempts from this address.', $ref: 'EchoError#' }
      },
      tags: ['Authentication'],
      summary: 'Sign up and set session cookie.'
    },
    config: { rateLimit: credentialsRateLimit },
    handler: controller.signUp
  })

  server.route<{ Body: LoginRequest; Reply: AuthToken }>({
    method: 'POST',
    url: '/auth/login',
    schema: {
      operationId: 'login',
      body: { $ref: 'LoginRequest#' },
      response: {
        200: { $ref: 'AuthToken#' },
        401: { $ref: 'AuthToken#' },
        429: { description: 'Too many attempts from this address.', $ref: 'EchoError#' }
      },
      tags: ['Authentication'],
      summary: 'Authenticate and set session cookie.'
    },
    config: { rateLimit: credentialsRateLimit },
    handler: controller.login
  })

  server.route<{ Reply: AuthToken }>({
    method: 'GET',
    url: '/auth/check',
    schema: {
      operationId: 'checkAuthStatus',
      response: {
        200: { $ref: 'AuthToken#' },
        401: { $ref: 'AuthToken#' }
      },
      tags: ['Authentication'],
      summary: 'Check if authenticated or not.'
    },
    handler: controller.check
  })

  server.route<{ Reply: AuthToken }>({
    method: 'POST',
    url: '/auth/logout',
    schema: {
      operationId: 'logout',
      response: {
        200: { $ref: 'AuthToken#' }
      },
      tags: ['Authentication'],
      summary: 'Clear the session cookie.'
    },
    handler: controller.logout
  })
}
