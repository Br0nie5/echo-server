import { z } from 'zod'

/**
 * Runtime validation of the body of `POST /auth/login`.
 *
 * The `LoginRequest` type is inferred from it.
 */
export const LoginRequestSchema = z.object({
  /** Name of the account to log into. */
  username: z.string(),
  /** Password of that account, in clear. */
  password: z.string()
})

/** The body of `POST /auth/login`. */
export type LoginRequest = z.infer<typeof LoginRequestSchema>
