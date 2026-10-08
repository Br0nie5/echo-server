import type { LoginRequest } from '@echo/utilities'
import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { useAuthRepository } from '../infra/useAuthRepository'

/** Mutation logging the user in. Its error is an `InvalidCredentialsError` when the credentials are refused. */
export const usePostLogin = (): UseMutationResult<void, Error, LoginRequest> => {
  const authRepository = useAuthRepository()

  return useMutation({
    mutationFn: (request) => authRepository.login(request)
  })
}
