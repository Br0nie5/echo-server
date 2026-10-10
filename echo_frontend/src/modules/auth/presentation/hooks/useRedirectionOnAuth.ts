import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useConfig } from '../../../../shared/config/useConfig'
import { getRedirectionPathOnAuth } from '../utils/getRedirectionPathOnAuth'

interface UseRedirectionOnAuthReturnType {
  /** Navigates, in place of the auth screen, to the path `getRedirectionPathOnAuth` gives. */
  redirectOnAuth: () => void
}

/** Where to go after authenticating: the `redirect` query param (set when a 401 sent the user here) when it is a path of the app, otherwise the logs screen. */
export const useRedirectionOnAuth = (): UseRedirectionOnAuthReturnType => {
  const { APP_URL } = useConfig()
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()
  const redirectionPath = getRedirectionPathOnAuth(searchParams.get('redirect'), APP_URL)

  const redirectOnAuth = useCallback((): void => {
    void navigate(redirectionPath, { replace: true })
  }, [navigate, redirectionPath])

  return { redirectOnAuth }
}
