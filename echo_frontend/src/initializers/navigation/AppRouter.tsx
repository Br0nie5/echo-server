import { lazy, Suspense, useMemo } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { useConfig } from '../../shared/config/useConfig'
import { LoadingLayout } from '../../shared/layouts/LoadingLayout'
import { AppPathNames } from '../../shared/navigation/pathNames'

import { getCleanUrlPathname } from './utils/getCleanUrlPathname'

const AuthScreen = lazy(() =>
  import('../../modules/auth/presentation/AuthScreen').then((module) => ({
    default: module.AuthScreen
  }))
)
const LogsScreen = lazy(() =>
  import('../../modules/logs/presentation/LogsScreen').then((module) => ({
    default: module.LogsScreen
  }))
)

/** A route of the app: the path of a screen, below `APP_URL`, and that screen. */
interface AppRoute {
  path: string
  screen: React.ReactElement
}

interface AppRouterProps {
  /** Gives what the router displays at a route: its screen when left out. */
  buildRouteElement?: (route: AppRoute) => React.ReactElement
}

const buildScreen = (route: AppRoute): React.ReactElement => route.screen

/**
 * The routes of the app.
 *
 * They are under the pathname of `APP_URL`, the `basename` of the router: every path the app
 * navigates to (`AppPathNames`) is below it. The auth screen only exists with authentication, and
 * a path that is no screen redirects to the default one: the auth screen with authentication, the
 * logs screen without.
 *
 * `buildRouteElement` replaces what a route displays, its screen by default.
 */
export const AppRouter: React.FC<AppRouterProps> = ({ buildRouteElement = buildScreen }) => {
  const { APP_URL, HAS_AUTHENTICATION } = useConfig()

  const appPathname = useMemo(() => {
    return getCleanUrlPathname(new URL(APP_URL))
  }, [APP_URL])

  const routes: AppRoute[] = [
    ...(HAS_AUTHENTICATION ? [{ path: AppPathNames.auth, screen: <AuthScreen /> }] : []),
    { path: AppPathNames.logs, screen: <LogsScreen /> }
  ]

  const defaultRoute = HAS_AUTHENTICATION ? AppPathNames.auth : AppPathNames.logs

  return (
    <BrowserRouter basename={appPathname}>
      <Suspense fallback={<LoadingLayout />}>
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={buildRouteElement(route)} />
          ))}
          <Route path="*" element={<Navigate to={defaultRoute} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
