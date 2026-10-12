import { z } from 'zod'

/**
 * Runtime validation of the body of `POST /auth/signup`.
 *
 * The `SignUpRequest` type is inferred from it.
 */
export const SignUpRequestSchema = z.object({
  /** Name the account is created with. */
  username: z.string(),
  /** Password the account is created with, in clear. */
  password: z.string()
})

/** The body of `POST /auth/signup`. */
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>
