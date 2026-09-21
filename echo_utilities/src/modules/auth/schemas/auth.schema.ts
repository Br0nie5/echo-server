import { z } from 'zod'

import type { AuthToken } from '../types/__generated__/authToken.js'

/** Runtime validation of the generated `AuthToken` type. */
export const AuthTokenSchema: z.ZodType<AuthToken> = z
  .object({
    success: z.boolean(),
    message: z.string().optional()
  })
  .strict()
