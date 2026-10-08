import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import type { AuthCheckResult } from '../domain/auth.repository'
import { useAuthRepository } from '../infra/useAuthRepository'

/** Query asking whether the user is authenticated, which decides what the auth screen shows. */
export function useGetAuthCheck(): UseQueryResult<AuthCheckResult> {
  const authRepository = useAuthRepository()

  return useQuery({
    queryKey: ['auth', 'check'],
    queryFn: () => authRepository.checkAuthentication()
  })
}
