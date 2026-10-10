import { MemoryRouter, type Location } from 'react-router-dom'

import type { FrontConfig } from '../../shared/config/frontConfig'
import { LocationObserver } from '../LocationObserver'

import { mockConfig } from './mockConfig'

interface AppRouterWrapperProps {
  /** The path, below `APP_URL`, with its query string, the router starts at. */
  initialPath: string
  /** The config whose `APP_URL` the router is below: `mockConfig` when left out. */
  config?: FrontConfig
  /** Called with the location, below `APP_URL`, at first and each time it changes. */
  onLocationChange?: (location: Location) => void
  children: React.ReactNode
}

/**
 * Puts its children in a router whose `basename` is the path of `APP_URL`, as `AppRouter` does.
 *
 * The router keeps its location in memory, so the address bar cannot be read: give
 * `onLocationChange` to check where the children navigate.
 *
 * ```tsx
 * <AppRouterWrapper initialPath="/logs?logSearch=text" onLocationChange={onLocationChange}>
 *   <LogsScreen />
 * </AppRouterWrapper>
 * ```
 */
export const AppRouterWrapper: React.FC<AppRouterWrapperProps> = ({
  initialPath,
  config = mockConfig,
  onLocationChange,
  children
}) => {
  const appPathname = new URL(config.APP_URL).pathname

  return (
    <MemoryRouter basename={appPathname} initialEntries={[`${appPathname}${initialPath}`]}>
      {onLocationChange !== undefined && <LocationObserver onLocationChange={onLocationChange} />}
      {children}
    </MemoryRouter>
  )
}
