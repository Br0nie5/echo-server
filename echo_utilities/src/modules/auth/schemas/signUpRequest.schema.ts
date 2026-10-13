import { z } from 'zod'

/**
 * Runtime validation of the body of `POST /auth/signup`.
 *
 * The `SignUpRequest` type is inferred from it. An empty username or password is refused, and the
 * properties it does not describe are left out of what it parses.
 */
export const SignUpRequestSchema = z.object({
  /** Name the account is created with, never empty. */
  username: z.string().min(1),
  /** Password the account is created with, in clear, never empty. */
  password: z.string().min(1)
})

/** The body of `POST /auth/signup`. */
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>
