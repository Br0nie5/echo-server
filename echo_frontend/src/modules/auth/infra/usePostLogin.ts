import type { LoginRequest } from '@echo/utilities'

import { postLoginMutationKey } from './keys/postLoginMutationKey'
import { usePostAuth, type PostAuthParams, type PostAuthResult } from './usePostAuth'

/** Variables of the login mutation. */
export type PostLoginParams = PostAuthParams<LoginRequest>

/** Mutation logging the user in. */
export const usePostLogin = (): PostAuthResult<LoginRequest> =>
  usePostAuth<LoginRequest>(postLoginMutationKey)
