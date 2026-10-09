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

/** Routes of the app, under the pathname of `APP_URL`. The auth screen only exists with authentication, and unknown paths redirect to the default screen. */
export const AppRouter: React.FC = () => {
  const { APP_URL, HAS_AUTHENTICATION } = useConfig()

  const appPathname = useMemo(() => {
    return getCleanUrlPathname(new URL(APP_URL))
  }, [APP_URL])

  const defaultRoute = HAS_AUTHENTICATION
    ? `${appPathname}${AppPathNames.auth}`
    : `${appPathname}${AppPathNames.logs}`

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingLayout />}>
        <Routes>
          {HAS_AUTHENTICATION && (
            <Route path={`${appPathname}${AppPathNames.auth}`} element={<AuthScreen />} />
          )}
          <Route path={`${appPathname}${AppPathNames.logs}`} element={<LogsScreen />} />
          <Route path="*" element={<Navigate to={defaultRoute} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
