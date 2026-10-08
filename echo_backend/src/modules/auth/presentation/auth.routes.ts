import type { AuthToken, LoginRequest, SignUpRequest } from '@echo/utilities'
import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify'

import type { AuthController } from './auth.controller.js'
import {
  AuthTokenJsonSchema,
  LoginRequestJsonSchema,
  SignUpRequestJsonSchema
} from './auth.schemas.js'

/** Options of the `authRoutes` plugin. */
export interface AuthRoutesOptions extends FastifyPluginOptions {
  controller: AuthController
}

/** Registers the `/auth/*` routes, and the schemas of `auth.schemas.ts` they refer to. */
export const authRoutes: FastifyPluginAsync<AuthRoutesOptions> = async (
  server: FastifyInstance,
  { controller }
): Promise<void> => {
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
        403: { $ref: 'AuthToken#' }
      },
      tags: ['Authentication'],
      summary: 'Sign up and set session cookie.'
    },
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
        401: { $ref: 'AuthToken#' }
      },
      tags: ['Authentication'],
      summary: 'Authenticate and set session cookie.'
    },
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
