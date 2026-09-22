import type { EchoError } from '@echo/utilities'
import { z } from 'zod'

/** Shape of a thrown value that already carries a usable HTTP status code and message. */
const EchoErrorLikeSchema = z.object({
  statusCode: z.number(),
  message: z.string()
})

/**
 * Normalizes any thrown value into an `EchoError`. Values that already carry a status code and
 * message (a manually-thrown `EchoError`, or a Fastify validation error) are passed through as-is;
 * anything else (a bare `Error`, a rejected promise value, ...) becomes a generic 500 so internal
 * error details are never leaked to the client.
 */
export const normalizeToEchoError = (error: unknown): EchoError => {
  const parsed = EchoErrorLikeSchema.safeParse(error)

  return parsed.success
    ? parsed.data
    : { statusCode: 500, message: 'An unexpected error occurred.' }
}
