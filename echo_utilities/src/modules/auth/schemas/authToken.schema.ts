import { z } from 'zod'

/**
 * Runtime validation of the answer of every auth route.
 *
 * The `AuthToken` type is inferred from it. An answer with a property it does not describe is
 * refused.
 *
 * ```ts
 * const authToken = AuthTokenSchema.parse(answer)
 * ```
 */
export const AuthTokenSchema = z.strictObject({
  /** Whether the request was accepted: the user is signed up, logged in, authenticated or logged out. */
  success: z.boolean(),
  /** Explains the outcome. */
  message: z.string().optional()
})

/** The answer of every auth route. */
export type AuthToken = z.infer<typeof AuthTokenSchema>
