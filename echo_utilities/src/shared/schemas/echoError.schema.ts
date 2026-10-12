import { z } from 'zod'

/**
 * Runtime validation of the error the API answers with.
 *
 * The `EchoError` type is inferred from it. The properties it does not describe are left out of
 * what it parses.
 */
export const EchoErrorSchema = z.object({
  /** HTTP status code of the answer. */
  statusCode: z.int(),
  /** Explains the error, in words the client can be shown. */
  message: z.string()
})

/** The error the API answers with. */
export type EchoError = z.infer<typeof EchoErrorSchema>
