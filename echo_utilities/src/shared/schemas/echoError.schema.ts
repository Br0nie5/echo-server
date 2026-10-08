import { z } from 'zod'

/**
 * Runtime validation of the error the API answers with.
 *
 * It is the single source of truth of that error: the `EchoError` type is derived from it, and so
 * is the schema of the API (see `errors.schemas.ts` in the backend). The properties it does not
 * describe are left out of what it parses.
 */
export const EchoErrorSchema = z.object({
  /** HTTP status code of the answer. */
  statusCode: z.int(),
  /** Explains the error, in words the client can be shown. */
  message: z.string()
})

/** The error the API answers with. */
export type EchoError = z.infer<typeof EchoErrorSchema>
