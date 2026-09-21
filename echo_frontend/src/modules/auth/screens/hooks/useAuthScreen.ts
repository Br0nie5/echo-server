import type { EchoEnv } from '@echo/utilities'
import type { QueryStatus } from '@tanstack/react-query'

import { useEnv } from '../../../../shared/env/useEnv'
import { useAppTranslation, type AppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { useGetAuthCheck, type AuthCheckResult } from '../../infra/useGetAuthCheck'

interface UseAuthScreenReturnType {
  translation: AppTranslation
  env: EchoEnv
  authCheckResult: AuthCheckResult | undefined
  authCheckResultStatus: QueryStatus
  refetchAuthResultCheck: () => void
}

/** Data of the auth screen: the auth check deciding which form to show, and its refetch. */
export const useAuthScreen = (): UseAuthScreenReturnType => {
  const translation = useAppTranslation()
  const env = useEnv()

  const {
    data: authCheckResult,
    status: authCheckResultStatus,
    refetch: refetchAuthResultCheck
  } = useGetAuthCheck()

  return {
    translation,
    env,
    authCheckResult,
    authCheckResultStatus,
    refetchAuthResultCheck
  }
}
