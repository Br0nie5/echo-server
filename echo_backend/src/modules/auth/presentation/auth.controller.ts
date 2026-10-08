import type { SignUpRequest } from '@echo/utilities'
import { needsSignupMessage, type AuthToken, type LoginRequest } from '@echo/utilities'
import type { FastifyReply, FastifyRequest } from 'fastify'

import type { AuthConfig } from '../../../shared/config/backConfig.js'
import type { AuthRepository } from '../domain/auth.repository.js'

type AuthReply = FastifyReply<{ Reply: AuthToken }>

/** Request handlers of the auth routes. Each one answers with an `AuthToken` describing the outcome. */
export interface AuthController {
  signUp: (request: FastifyRequest<{ Body: SignUpRequest }>, reply: AuthReply) => Promise<void>
  login: (request: FastifyRequest<{ Body: LoginRequest }>, reply: AuthReply) => Promise<void>
  check: (request: FastifyRequest, reply: AuthReply) => Promise<void>
  logout: (request: FastifyRequest, reply: AuthReply) => Promise<void>
}

/**
 * Builds the auth handlers, which read and create the accounts through `authRepository`.
 *
 * A successful `signUp` or `login` signs a JWT and stores it in the session cookie described by
 * `authConfig`; `logout` clears it.
 */
export const createAuthController = (
  authRepository: AuthRepository,
  { cookieName, cookieSerializeOptions }: AuthConfig
): AuthController => ({
  signUp: async (
    request: FastifyRequest<{ Body: SignUpRequest }>,
    reply: FastifyReply<{ Reply: AuthToken }>
  ): Promise<void> => {
    const { username, password } = request.body

    const isSignedUp = await authRepository.signUpFirstAdmin(username, password)
    if (!isSignedUp) {
      return reply.status(403).send({ success: false, message: 'Unauthorized.' })
    }

    const token = request.server.jwt.sign({ user: username })
    reply.setCookie(cookieName, token, cookieSerializeOptions)

    return reply.status(200).send({ success: true, message: 'Sign up successful.' })
  },

  login: async (
    request: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply<{ Reply: AuthToken }>
  ): Promise<void> => {
    const { username, password } = request.body

    if (!(await authRepository.areCredentialsValid(username, password))) {
      return reply.status(401).send({ success: false, message: 'Invalid credentials.' })
    }

    const token = request.server.jwt.sign({ user: username })
    reply.setCookie(cookieName, token, cookieSerializeOptions)

    return reply.status(200).send({ success: true, message: 'Login successful.' })
  },

  /** Answers 401 with `needsSignupMessage` while no account exists, so the frontend can show the sign up form. */
  check: async (
    request: FastifyRequest,
    reply: FastifyReply<{ Reply: AuthToken }>
  ): Promise<void> => {
    if (authRepository.needsSignup()) {
      return reply.status(401).send({ success: false, message: needsSignupMessage })
    }

    try {
      await request.jwtVerify()
      return reply.status(200).send({ success: true, message: 'Token is valid.' })
    } catch {
      return reply.status(401).send({ success: false, message: 'Invalid token.' })
    }
  },

  logout: async (_: FastifyRequest, reply: FastifyReply<{ Reply: AuthToken }>): Promise<void> => {
    reply.clearCookie(cookieName, cookieSerializeOptions)

    return reply.status(200).send({ success: true, message: 'Logged out successfully.' })
  }
})
