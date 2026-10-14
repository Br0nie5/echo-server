import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useConfig } from '../../../../shared/config/useConfig'
import { getRedirectionPathOnAuth } from '../utils/getRedirectionPathOnAuth'

interface UseRedirectionOnAuthReturnType {
  /** Navigates, in place of the auth screen, to the path `getRedirectionPathOnAuth` gives. */
  redirectOnAuth: () => void
  /** The whole URL `redirectOnAuth` navigates to, as the address bar shows it. */
  redirectionUrl: string
}

/**
 * Gives the function leaving the auth screen once authenticated, and the URL it goes to.
 *
 * That is the `redirect` query param, set when a 401 sent the user here, when it is a path of the
 * app, otherwise the logs screen.
 */
export const useRedirectionOnAuth = (): UseRedirectionOnAuthReturnType => {
  const { appUrl } = useConfig()
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()
  const redirectionPath = getRedirectionPathOnAuth(searchParams.get('redirect'), appUrl)

  const redirectOnAuth = useCallback((): void => {
    void navigate(redirectionPath, { replace: true })
  }, [navigate, redirectionPath])

  return { redirectOnAuth, redirectionUrl: `${appUrl}${redirectionPath}` }
}
