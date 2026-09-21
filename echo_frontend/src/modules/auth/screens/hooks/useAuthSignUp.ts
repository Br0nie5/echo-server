import type { SignUpRequest } from '@echo/utilities'
import type { MutationStatus } from '@tanstack/react-query'

import { usePostSignUp } from '../../infra/usePostSignUp'
import type { OnFormSubmitType } from '../utils/types'

import { useAuthSubmit } from './useAuthSubmit'

interface UseAuthSignUpReturnType {
  signUp: OnFormSubmitType
  postSignUpMutationStatus: MutationStatus
}

/** Sign up submit handler: alerts the outcome and redirects on success. */
export const useAuthSignUp = (): UseAuthSignUpReturnType => {
  const { mutate, status: postSignUpMutationStatus } = usePostSignUp()

  const signUp = useAuthSubmit<SignUpRequest>({
    mutate,
    successMessageKey: 'auth.signUp.success',
    getErrorMessageKey: () => 'auth.error'
  })

  return { signUp, postSignUpMutationStatus }
}
