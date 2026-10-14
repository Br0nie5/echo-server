import type { SignUpRequest } from '@echo/utilities'
import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { useAuthRepository } from '../infra/useAuthRepository'

/** Mutation creating the first account, the one of the admin, which logs the user in. */
export const usePostSignUp = (): UseMutationResult<void, Error, SignUpRequest> => {
  const authRepository = useAuthRepository()

  return useMutation({
    mutationFn: (request) => authRepository.signUp(request)
  })
}
