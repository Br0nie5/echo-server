import { z } from 'zod'

/**
 * Runtime validation of the answer of `GET /auth/status`.
 *
 * The `AuthStatus` type is inferred from it. An answer with a property it does not describe is
 * refused.
 *
 * ```ts
 * const { status } = AuthStatusSchema.parse(answer)
 * ```
 */
export const AuthStatusSchema = z.strictObject({
  /**
   * Where the request stands: `authenticated` when it carries a valid session, `unauthenticated`
   * when it carries none, and `needsSignUp` when no account exists yet, whatever it carries.
   */
  status: z.enum(['authenticated', 'unauthenticated', 'needsSignUp'])
})

/** The answer of `GET /auth/status`. */
export type AuthStatus = z.infer<typeof AuthStatusSchema>
