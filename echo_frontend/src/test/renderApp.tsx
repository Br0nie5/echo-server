import type { RenderResult } from '@testing-library/react'
import { Route, Routes, type Location } from 'react-router-dom'

import type { FrontConfig } from '../shared/config/frontConfig.ts'

import { renderComponent } from './renderComponent.tsx'
import { AppRouterWrapper } from './utils/AppRouterWrapper.tsx'
import { mockConfig } from './utils/mockConfig.ts'

/**
 * Renders `child` as the screen of `testPath`, inside the providers of the app and a router whose
 * `basename` is the path of `APP_URL`, as `AppRouter` does.
 *
 * `pathParams` is the query string the screen is opened with (`'?fromDate=…'`). Only `testPath`
 * renders `child`: a screen navigating elsewhere renders nothing.
 *
 * The router keeps its location in memory, so the address bar cannot be read. To check the URL a
 * screen navigates to, give `params.onLocationChange`: it is called with the location, below
 * `APP_URL`, at first and each time it changes.
 *
 * ```tsx
 * const onLocationChange = vi.fn<(location: Location) => void>()
 *
 * await renderApp(AppPathNames.logs, <LogsScreen />, '?logSearch=text', { onLocationChange })
 *
 * expect(onLocationChange.mock.lastCall?.[0].search).toBe('?logSearch=text')
 * ```
 */
export const renderApp = async (
  testPath: string,
  child: React.ReactElement,
  pathParams?: string,
  params?: { configOverride?: FrontConfig; onLocationChange?: (location: Location) => void }
): Promise<RenderResult> => {
  const config = params?.configOverride ?? mockConfig

  return renderComponent(
    <AppRouterWrapper
      initialPath={`${testPath}${pathParams ?? ''}`}
      config={config}
      onLocationChange={params?.onLocationChange}
    >
      <Routes>
        <Route path={testPath} element={child} />
      </Routes>
    </AppRouterWrapper>,
    { configOverride: config }
  )
}
