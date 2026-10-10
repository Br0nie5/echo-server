import type { SignUpRequest } from '@echo/utilities'
import { needsSignupMessage, type AuthToken, type LoginRequest } from '@echo/utilities'
import type { FastifyReply, FastifyRequest } from 'fastify'

import type { AuthConfig } from '../../../shared/config/backConfig.js'
import { canSignUp, createSignUpFirstAdmin } from '../application/signUpFirstAdmin.js'
import { validateCredentials } from '../application/validateCredentials.js'
import type { AuthRepository } from '../domain/auth.repository.js'
import { SignUpRefusedError } from '../domain/signUpRefusedError.js'

type AuthReply = FastifyReply<{ Reply: AuthToken }>

/** Request handlers of the auth routes. Each one answers with an `AuthToken` describing the outcome. */
export interface AuthController {
  signUp: (request: FastifyRequest<{ Body: SignUpRequest }>, reply: AuthReply) => Promise<void>
  login: (request: FastifyRequest<{ Body: LoginRequest }>, reply: AuthReply) => Promise<void>
  check: (request: FastifyRequest, reply: AuthReply) => Promise<void>
  logout: (request: FastifyRequest, reply: AuthReply) => Promise<void>
}

/**
 * Builds the auth handlers, on top of the accounts of `authRepository`.
 *
 * `signUp` and `login` call the use cases of `application/`, which decide whether the user may.
 * When it may, they sign a JWT and store it in the session cookie described by `authConfig`;
 * `logout` clears it. A sign up the use case refuses is answered with a 403, and any other error
 * of the use cases is thrown.
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
          return reply.status(403).send({ success: false, message: 'Unauthorized.' })
        }

        throw error
      }

      openSession(request, reply, username)

      return reply.status(200).send({ success: true, message: 'Sign up successful.' })
    },

    login: async (
      request: FastifyRequest<{ Body: LoginRequest }>,
      reply: AuthReply
    ): Promise<void> => {
      const { username, password } = request.body

      if (!(await validateCredentials(authRepository, username, password))) {
        return reply.status(401).send({ success: false, message: 'Invalid credentials.' })
      }

      openSession(request, reply, username)

      return reply.status(200).send({ success: true, message: 'Login successful.' })
    },

    /** Answers 401 with `needsSignupMessage` while no account exists, so the frontend can show the sign up form. */
    check: async (request: FastifyRequest, reply: AuthReply): Promise<void> => {
      if (await canSignUp(authRepository)) {
        return reply.status(401).send({ success: false, message: needsSignupMessage })
      }

      try {
        await request.jwtVerify()
        return reply.status(200).send({ success: true, message: 'Token is valid.' })
      } catch {
        return reply.status(401).send({ success: false, message: 'Invalid token.' })
      }
    },

    logout: async (_: FastifyRequest, reply: AuthReply): Promise<void> => {
      reply.clearCookie(cookieName, cookieSerializeOptions)

      return reply.status(200).send({ success: true, message: 'Logged out successfully.' })
    }
  }
}
