import { MemoryRouter, type Location } from 'react-router-dom'

import { getPathnameWithoutTrailingSlashes } from '../../initializers/navigation/utils/getPathnameWithoutTrailingSlashes'
import { mockAppUrls } from '../mocks/mockConfig'

import { LocationObserver } from './LocationObserver'

interface AppRouterWrapperProps {
  /** The path, below `appUrl`, with its query string, the router starts at. */
  initialPath: string
  /** The URL of the app, which the router is below: the one of `mockAppUrls` when left out. */
  appUrl?: string
  /** Called with the location, below `appUrl`, at first and each time it changes. */
  onLocationChange?: (location: Location) => void
  children: React.ReactNode
}

/**
 * Puts its children in a router whose `basename` is the path of `appUrl`, as `AppRouter` does.
 *
 * The router keeps its location in memory, so the address bar cannot be read: give
 * `onLocationChange` to check where the children navigate.
 *
 * ```tsx
 * <AppRouterWrapper initialPath="/logs?logSearch=text" onLocationChange={onLocationChange}>
 *   {children}
 * </AppRouterWrapper>
 * ```
 */
export const AppRouterWrapper: React.FC<AppRouterWrapperProps> = ({
  initialPath,
  appUrl = mockAppUrls.appUrl,
  onLocationChange,
  children
}) => {
  const appPathname = getPathnameWithoutTrailingSlashes(new URL(appUrl))

  return (
    <MemoryRouter basename={appPathname} initialEntries={[`${appPathname}${initialPath}`]}>
      {onLocationChange !== undefined && <LocationObserver onLocationChange={onLocationChange} />}
      {children}
    </MemoryRouter>
  )
}
