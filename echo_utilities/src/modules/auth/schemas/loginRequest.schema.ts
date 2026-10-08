import { z } from 'zod'

/**
 * Runtime validation of the body of `POST /auth/login`.
 *
 * It is the single source of truth of that body: the `LoginRequest` type is derived from it, and so
 * is the schema of the route (see `auth.schemas.ts` in the backend).
 */
export const LoginRequestSchema = z.object({
  /** Name of the account to log into. */
  username: z.string(),
  /** Password of that account, in clear. */
  password: z.string()
})

/** The body of `POST /auth/login`. */
export type LoginRequest = z.infer<typeof LoginRequestSchema>
