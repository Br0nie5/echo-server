import { EchoErrorSchema, type EchoError } from '@echo/utilities'

/**
 * Normalizes any thrown value into the `EchoError` the client is answered with.
 *
 * A value that carries a message and a status code saying the request is at fault, from 400 to 499
 * (a manually-thrown `EchoError`, a Fastify validation error), keeps both, and only them. Anything
 * else (a bare `Error`, a rejected promise value, an error carrying a 500 and what failed inside
 * the server...) becomes a generic 500, so internal error details are never leaked to the client.
 *
 * ```ts
 * normalizeToEchoError({ statusCode: 400, message: 'Bad input.', code: 'FST_ERR_VALIDATION' })
 * // { statusCode: 400, message: 'Bad input.' }
 * normalizeToEchoError(new Error('The database is locked.'))
 * // { statusCode: 500, message: 'An unexpected error occurred.' }
 * ```
 */
export const normalizeToEchoError = (error: unknown): EchoError => {
  const parsedError = EchoErrorSchema.safeParse(error)
  const isRequestAtFault =
    parsedError.success && parsedError.data.statusCode >= 400 && parsedError.data.statusCode < 500

  return isRequestAtFault
    ? parsedError.data
    : { statusCode: 500, message: 'An unexpected error occurred.' }
}
