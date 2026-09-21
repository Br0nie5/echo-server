import type { LoginRequest } from '@echo/utilities'
import type { MutationStatus } from '@tanstack/react-query'

import { usePostLogin } from '../../infra/usePostLogin'
import type { OnFormSubmitType } from '../utils/types'

import { useAuthSubmit } from './useAuthSubmit'

interface UseAuthLoginReturnType {
  login: OnFormSubmitType
  postLoginMutationStatus: MutationStatus
}

/** Login submit handler: alerts the outcome (invalid credentials on 401) and redirects on success. */
export const useAuthLogin = (): UseAuthLoginReturnType => {
  const { mutate, status: postLoginMutationStatus } = usePostLogin()

  const login = useAuthSubmit<LoginRequest>({
    mutate,
    successMessageKey: 'auth.login.success',
    getErrorMessageKey: (error) =>
      error?.status === 401 ? 'auth.login.invalidCredentials' : 'auth.error'
  })

  return { login, postLoginMutationStatus }
}
