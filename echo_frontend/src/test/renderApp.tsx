import type { Config } from '@echo/utilities'
import type { RenderResult } from '@testing-library/react'
import { MemoryRouter, Route, Routes, type Location } from 'react-router-dom'

import { LocationObserver } from './LocationObserver.tsx'
import { renderComponent } from './renderComponent.tsx'
import { testConfig } from './utils/config.ts'

/**
 * Renders `child` as the screen of `testPath`, inside the providers and the router of the app.
 *
 * `pathParams` is the query string the screen is opened with (`'?fromDate=…'`).
 *
 * The router keeps its location in memory, so the address bar cannot be read. To check the URL a
 * screen navigates to, give `params.onLocationChange`: it is called with the location at first and
 * each time it changes.
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
  params?: { configOverride?: Config; onLocationChange?: (location: Location) => void }
): Promise<RenderResult> => {
  const config = params?.configOverride ?? testConfig

  const initialPath = `${new URL(config.APP_URL).pathname}${testPath}`

  const initialPathWithParams = `${initialPath}${pathParams !== undefined ? pathParams : ''}`

  const screen = await renderComponent(
    <MemoryRouter initialEntries={[initialPathWithParams]}>
      {params?.onLocationChange !== undefined && (
        <LocationObserver onLocationChange={params.onLocationChange} />
      )}
      <Routes>
        <Route path={initialPath} element={child} />
      </Routes>
    </MemoryRouter>,
    { configOverride: config }
  )

  return screen
}
