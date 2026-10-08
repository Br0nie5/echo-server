import { z } from 'zod'

/**
 * Runtime validation of the body of `POST /auth/signup`.
 *
 * It is the single source of truth of that body: the `SignUpRequest` type is derived from it, and
 * so is the schema of the route (see `auth.schemas.ts` in the backend).
 */
export const SignUpRequestSchema = z.object({
  /** Name the account is created with. */
  username: z.string(),
  /** Password the account is created with, in clear. */
  password: z.string()
})

/** The body of `POST /auth/signup`. */
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>
