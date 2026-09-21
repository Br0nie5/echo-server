import type { EchoError } from '@echo/utilities'
import type { FastifyReply, FastifyRequest } from 'fastify'

/** Fastify `preHandler` rejecting requests that do not carry a valid JWT. */
export const requireAuthentication = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    await request.jwtVerify()
  } catch {
    const error: EchoError = { statusCode: 401, message: 'Invalid token.' }
    return reply.status(error.statusCode).send(error)
  }
}
