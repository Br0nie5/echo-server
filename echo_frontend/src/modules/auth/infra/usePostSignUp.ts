import type { SignUpRequest } from '@echo/utilities'

import { postSignUpMutationKey } from './keys/postSignUpMutationKey'
import { usePostAuth, type PostAuthParams, type PostAuthResult } from './usePostAuth'

/** Variables of the sign up mutation. */
export type PostSignUpParams = PostAuthParams<SignUpRequest>

/** Mutation creating the first (admin) account. */
export const usePostSignUp = (): PostAuthResult<SignUpRequest> =>
  usePostAuth<SignUpRequest>(postSignUpMutationKey)
