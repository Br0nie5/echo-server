import { z } from 'zod'

/**
 * Runtime validation of the body of `POST /auth/login`.
 *
 * The `LoginRequest` type is inferred from it. An empty username or password is refused, and the
 * properties it does not describe are left out of what it parses.
 */
export const LoginRequestSchema = z.object({
  /** Name of the account to log into, never empty. */
  username: z.string().min(1),
  /** Password of that account, in clear, never empty. */
  password: z.string().min(1)
})

/** The body of `POST /auth/login`. */
export type LoginRequest = z.infer<typeof LoginRequestSchema>
