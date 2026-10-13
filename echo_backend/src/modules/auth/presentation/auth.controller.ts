import type { AuthStatus, EchoError, LoginRequest, SignUpRequest } from '@echo/utilities'
import type { FastifyReply, FastifyRequest } from 'fastify'

import type { AuthConfig } from '../../../shared/config/authConfig.js'
import { canSignUp, createSignUpFirstAdmin } from '../application/signUpFirstAdmin.js'
import { validateCredentials } from '../application/validateCredentials.js'
import type { AuthRepository } from '../domain/auth.repository.js'
import { SignUpRefusedError } from '../domain/signUpRefusedError.js'

/** What the sign up, the login and the logout answer, by status code: nothing, or why they refuse. */
export type SessionReply = { 204: undefined; 401: EchoError; 403: EchoError }

type AuthReply = FastifyReply<{ Reply: SessionReply }>
type AuthStatusReply = FastifyReply<{ Reply: AuthStatus }>

/**
 * Request handlers of the auth routes.
 *
 * `signUp`, `login` and `logout` answer a 204 with no body when they did what was asked, and
 * `getStatus` an `AuthStatus`.
 */
export interface AuthController {
  signUp: (request: FastifyRequest<{ Body: SignUpRequest }>, reply: AuthReply) => Promise<void>
  login: (request: FastifyRequest<{ Body: LoginRequest }>, reply: AuthReply) => Promise<void>
  getStatus: (request: FastifyRequest, reply: AuthStatusReply) => Promise<void>
  logout: (request: FastifyRequest, reply: AuthReply) => Promise<void>
}

/**
 * Builds the auth handlers, on top of the accounts of `authRepository`.
 *
 * `signUp` and `login` call the use cases of `application/`, which decide whether the user may.
 * When it may, they sign a JWT and store it in the session cookie described by `authConfig`;
 * `logout` clears it. A sign up the use case refuses is answered with a 403 and credentials that
 * are not those of an account with a 401, both an `EchoError`, and any other error of the use
 * cases is thrown.
 *
 * `getStatus` always answers a 200, saying where the request stands: `needsSignUp` while no
 * account exists, whatever the request carries, then `authenticated` or `unauthenticated`
 * depending on its JWT.
 */
export const createAuthController = (
  authRepository: AuthRepository,
  { cookieName, cookieSerializeOptions }: AuthConfig
): AuthController => {
  const signUpFirstAdmin = createSignUpFirstAdmin(authRepository)

  const openSession = (request: FastifyRequest, reply: AuthReply, username: string): void => {
    const token = request.server.jwt.sign({ user: username })
    reply.setCookie(cookieName, token, cookieSerializeOptions)
  }

  return {
    signUp: async (
      request: FastifyRequest<{ Body: SignUpRequest }>,
      reply: AuthReply
    ): Promise<void> => {
      const { username, password } = request.body

      try {
        await signUpFirstAdmin(username, password)
      } catch (error) {
        if (error instanceof SignUpRefusedError) {
          request.log.warn({ err: error }, 'Sign up refused')
          return reply.status(403).send({ statusCode: 403, message: 'Sign up refused.' })
        }

        throw error
      }

      openSession(request, reply, username)

      return reply.status(204).send()
    },

    login: async (
      request: FastifyRequest<{ Body: LoginRequest }>,
      reply: AuthReply
    ): Promise<void> => {
      const { username, password } = request.body

      if (!(await validateCredentials(authRepository, username, password))) {
        return reply.status(401).send({ statusCode: 401, message: 'Invalid credentials.' })
      }

      openSession(request, reply, username)

      return reply.status(204).send()
    },

    getStatus: async (request: FastifyRequest, reply: AuthStatusReply): Promise<void> => {
      if (await canSignUp(authRepository)) {
        return reply.status(200).send({ status: 'needsSignUp' })
      }

      try {
        await request.jwtVerify()
        return reply.status(200).send({ status: 'authenticated' })
      } catch {
        return reply.status(200).send({ status: 'unauthenticated' })
      }
    },

    logout: async (_: FastifyRequest, reply: AuthReply): Promise<void> => {
      reply.clearCookie(cookieName, cookieSerializeOptions)

      return reply.status(204).send()
    }
  }
}
