import type { QueryStatus } from '@tanstack/react-query'

import type { FrontConfig } from '../../../../shared/config/frontConfig'
import { useConfig } from '../../../../shared/config/useConfig'
import { useGetAuthCheck } from '../../application/useGetAuthCheck'
import type { AuthCheckResult } from '../../domain/auth.repository'

interface UseAuthScreenReturnType {
  config: FrontConfig
  authCheckResult: AuthCheckResult | undefined
  authCheckStatus: QueryStatus
  refetchAuthCheck: () => void
}

/**
 * Gives the data of the auth screen: the config, and the auth check deciding what it displays,
 * with its status and its refetch.
 */
export const useAuthScreen = (): UseAuthScreenReturnType => {
  const config = useConfig()

  const {
    data: authCheckResult,
    status: authCheckStatus,
    refetch: refetchAuthCheck
  } = useGetAuthCheck()

  return { config, authCheckResult, authCheckStatus, refetchAuthCheck }
}
