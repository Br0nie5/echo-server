import { useCallback, useLayoutEffect, useRef } from 'react'
import { createSearchParams, matchPath, useLocation, useNavigate } from 'react-router-dom'

import { AppPathNames } from './pathNames'

/**
 * A function navigating to the auth screen, in place of the current page, unless the auth screen is
 * the current page.
 *
 * The current page, when the function is called, is passed as the `redirect` query param, as a
 * path below `APP_URL`, where the auth screen sends the user back once authenticated.
 *
 * ```ts
 * const goToAuthScreen = useGoToAuthScreen()
 * goToAuthScreen()
 * ```
 */
export const useGoToAuthScreen = (): (() => void) => {
  const navigate = useNavigate()
  const location = useLocation()

  // Read when the function is called, not when it was created: a request started before the page
  // updated its query params would otherwise bring the user back without them.
  const currentLocation = useRef(location)
  useLayoutEffect(() => {
    currentLocation.current = location
  }, [location])

  return useCallback(() => {
    const { pathname, search } = currentLocation.current

    if (matchPath(AppPathNames.auth, pathname) !== null) {
      return
    }

    void navigate(
      {
        pathname: AppPathNames.auth,
        search: createSearchParams({ redirect: `${pathname}${search}` }).toString()
      },
      { replace: true }
    )
  }, [navigate])
}
