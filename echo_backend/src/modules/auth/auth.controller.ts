import type { SignUpRequest } from '@echo/utilities'
import { needsSignupMessage, type AuthToken, type LoginRequest } from '@echo/utilities'
import type { FastifyReply, FastifyRequest } from 'fastify'

import type { EchoBackEnv } from '../../shared/types/echoBackEnv.js'

import type { AuthService } from './auth.service.js'

/** Cookie settings the controller needs to set and clear the session cookie. */
export type AuthControllerConfig = Pick<EchoBackEnv, 'COOKIE_NAME' | 'COOKIE_SERIALIZE_OPTIONS'>

type AuthReply = FastifyReply<{ Reply: AuthToken }>

/** Request handlers of the auth routes. Each one answers with an `AuthToken` describing the outcome. */
export interface AuthController {
  signUp: (request: FastifyRequest<{ Body: SignUpRequest }>, reply: AuthReply) => Promise<void>
  login: (request: FastifyRequest<{ Body: LoginRequest }>, reply: AuthReply) => Promise<void>
  check: (request: FastifyRequest, reply: AuthReply) => Promise<void>
  logout: (request: FastifyRequest, reply: AuthReply) => Promise<void>
}

/**
 * Builds the auth handlers on top of `authService`.
 * A successful `signUp` or `login` signs a JWT and stores it in an httpOnly cookie; `logout` clears it.
 */
export const createAuthController = (
  authService: AuthService,
  env: AuthControllerConfig
): AuthController => ({
  signUp: async (
    request: FastifyRequest<{ Body: SignUpRequest }>,
    reply: FastifyReply<{ Reply: AuthToken }>
  ): Promise<void> => {
    const { username, password } = request.body

    const isSignedUp = await authService.signUpFirstAdmin(username, password)
    if (!isSignedUp) {
      return reply.status(403).send({ success: false, message: 'Unauthorized.' })
    }

    const token = request.server.jwt.sign({ user: username })
    reply.setCookie(env.COOKIE_NAME, token, env.COOKIE_SERIALIZE_OPTIONS)

    return reply.status(200).send({ success: true, message: 'Sign up successful.' })
  },

  login: async (
    request: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply<{ Reply: AuthToken }>
  ): Promise<void> => {
    const { username, password } = request.body

    if (!(await authService.areCredentialsValid(username, password))) {
      return reply.status(401).send({ success: false, message: 'Invalid credentials.' })
    }

    const token = request.server.jwt.sign({ user: username })
    reply.setCookie(env.COOKIE_NAME, token, env.COOKIE_SERIALIZE_OPTIONS)

    return reply.status(200).send({ success: true, message: 'Login successful.' })
  },

  /** Answers 401 with `needsSignupMessage` while no account exists, so the frontend can show the sign up form. */
  check: async (
    request: FastifyRequest,
    reply: FastifyReply<{ Reply: AuthToken }>
  ): Promise<void> => {
    if (authService.needsSignup()) {
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
    reply.clearCookie(env.COOKIE_NAME, env.COOKIE_SERIALIZE_OPTIONS)

    return reply.status(200).send({ success: true, message: 'Logged out successfully.' })
  }
})
