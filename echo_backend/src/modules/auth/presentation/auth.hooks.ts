import type { EchoError } from '@echo/utilities'
import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * Answers a 401 to a request that carries no valid JWT, and lets any other one through.
 *
 * It is meant to run first, as the `onRequest` hook of the routes to protect, so that a request
 * without a session learns nothing else of the route, not even what its query should be.
 */
export const rejectUnauthenticatedRequest = async (
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
