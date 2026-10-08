import type { Config } from '@echo/utilities'
import type { QueryStatus } from '@tanstack/react-query'

import { useConfig } from '../../../../shared/config/useConfig'
import { useAppTranslation, type AppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { useGetAuthCheck } from '../../application/useGetAuthCheck'
import type { AuthCheckResult } from '../../domain/auth.repository'

interface UseAuthScreenReturnType {
  translation: AppTranslation
  config: Config
  authCheckResult: AuthCheckResult | undefined
  authCheckResultStatus: QueryStatus
  refetchAuthResultCheck: () => void
}

/** Data of the auth screen: the auth check deciding which form to show, and its refetch. */
export const useAuthScreen = (): UseAuthScreenReturnType => {
  const translation = useAppTranslation()
  const config = useConfig()

  const {
    data: authCheckResult,
    status: authCheckResultStatus,
    refetch: refetchAuthResultCheck
  } = useGetAuthCheck()

  return {
    translation,
    config,
    authCheckResult,
    authCheckResultStatus,
    refetchAuthResultCheck
  }
}
