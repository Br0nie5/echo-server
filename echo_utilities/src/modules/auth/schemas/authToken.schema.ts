import { z } from 'zod'

/**
 * Runtime validation of the answer of every auth route.
 *
 * It is the single source of truth of that answer: the `AuthToken` type is derived from it, and so
 * is the schema of the API (see `auth.schemas.ts` in the backend). The frontend checks the API
 * answers with it.
 */
export const AuthTokenSchema = z.strictObject({
  /** Whether the request was accepted: the user is signed up, logged in, authenticated or logged out. */
  success: z.boolean(),
  /** Explains the outcome. */
  message: z.string().optional()
})

/** The answer of every auth route. */
export type AuthToken = z.infer<typeof AuthTokenSchema>
