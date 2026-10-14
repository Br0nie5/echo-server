import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import type { AuthCheckResult } from '../domain/auth.repository'
import { useAuthRepository } from '../infra/useAuthRepository'

/**
 * Query asking whether the user is authenticated, which decides what the auth screen shows.
 *
 * Its result is dropped as soon as no screen uses it, so the auth screen checks again each time
 * it opens: a session can end in between.
 */
export function useGetAuthCheck(): UseQueryResult<AuthCheckResult> {
  const authRepository = useAuthRepository()

  return useQuery({
    queryKey: ['auth', 'check'],
    queryFn: ({ signal }) => authRepository.checkAuthentication(signal),
    gcTime: 0
  })
}
