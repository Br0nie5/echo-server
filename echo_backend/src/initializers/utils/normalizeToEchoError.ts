import { EchoErrorSchema, type EchoError } from '@echo/utilities'

/**
 * Normalizes any thrown value into an `EchoError`.
 *
 * A value that already carries a status code and a message (a manually-thrown `EchoError`, or a
 * Fastify validation error) keeps both, and only them. Anything else (a bare `Error`, a rejected
 * promise value, ...) becomes a generic 500, so internal error details are never leaked to the
 * client.
 */
export const normalizeToEchoError = (error: unknown): EchoError => {
  const parsedError = EchoErrorSchema.safeParse(error)

  return parsedError.success
    ? parsedError.data
    : { statusCode: 500, message: 'An unexpected error occurred.' }
}
