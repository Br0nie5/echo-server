import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useEnv } from '../../../../shared/env/useEnv'
import { AppPathNames } from '../../../../shared/navigation/pathNames'

interface UseRedirectionOnAuthReturnType {
  redirectOnAuth: () => void
}

/** Where to go after authenticating: the `redirect` query param (set when a 401 sent the user here), otherwise the logs screen. */
export const useRedirectionOnAuth = (): UseRedirectionOnAuthReturnType => {
  const { APP_URL } = useEnv()

  const [searchParams] = useSearchParams()
  const redirectPath = searchParams.get('redirect') ?? undefined

  const redirectOnAuth = useCallback((): void => {
    if (redirectPath) {
      window.location.href = redirectPath
    } else {
      window.location.href = `${APP_URL}${AppPathNames.logs}`
    }
  }, [redirectPath, APP_URL])

  return { redirectOnAuth }
}
