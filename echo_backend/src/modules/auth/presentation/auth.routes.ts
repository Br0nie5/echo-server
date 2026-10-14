import type { AuthStatus, LoginRequest, SignUpRequest } from '@echo/utilities'
import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify'

import type { AuthConfig } from '../../../shared/config/authConfig.js'

import type { AuthController, SessionReply } from './auth.controller.js'
import {
  AuthStatusJsonSchema,
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
 * `credentialsAttemptsLimit` of `authConfig` is reached, when `@fastify/rate-limit` is registered
 * on the server.
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

  server.addSchema(AuthStatusJsonSchema)
  server.addSchema(LoginRequestJsonSchema)
  server.addSchema(SignUpRequestJsonSchema)

  server.route<{ Body: SignUpRequest; Reply: SessionReply }>({
    method: 'POST',
    url: '/auth/signup',
    schema: {
      operationId: 'signUp',
      body: { $ref: 'SignUpRequest#' },
      response: {
        204: { description: 'The account is created and the session opened.', type: 'null' },
        403: {
          description: 'An account already exists, or another sign up is in progress.',
          $ref: 'EchoError#'
        },
        429: { description: 'Too many attempts from this address.', $ref: 'EchoError#' }
      },
      tags: ['Authentication'],
      summary: 'Sign up and set session cookie.'
    },
    config: { rateLimit: credentialsRateLimit },
    handler: controller.signUp
  })

  server.route<{ Body: LoginRequest; Reply: SessionReply }>({
    method: 'POST',
    url: '/auth/login',
    schema: {
      operationId: 'login',
      body: { $ref: 'LoginRequest#' },
      response: {
        204: { description: 'The session is opened.', type: 'null' },
        401: { description: 'The username or the password is wrong.', $ref: 'EchoError#' },
        429: { description: 'Too many attempts from this address.', $ref: 'EchoError#' }
      },
      tags: ['Authentication'],
      summary: 'Authenticate and set session cookie.'
    },
    config: { rateLimit: credentialsRateLimit },
    handler: controller.login
  })

  server.route<{ Reply: AuthStatus }>({
    method: 'GET',
    url: '/auth/status',
    schema: {
      operationId: 'getAuthStatus',
      response: {
        200: { $ref: 'AuthStatus#' }
      },
      tags: ['Authentication'],
      summary:
        'Tell whether the request is authenticated, is not, or whether no account exists yet.'
    },
    handler: controller.getStatus
  })

  server.route<{ Reply: SessionReply }>({
    method: 'POST',
    url: '/auth/logout',
    schema: {
      operationId: 'logout',
      response: {
        204: { description: 'The session cookie is cleared.', type: 'null' }
      },
      tags: ['Authentication'],
      summary: 'Clear the session cookie.'
    },
    handler: controller.logout
  })
}
