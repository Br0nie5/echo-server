import { render, type RenderResult } from '@testing-library/react'
import nock from 'nock'
import { matchPath } from 'react-router-dom'

import '../shared/i18n/i18n.ts'

import { App } from '../App.tsx'
import { AppProviders } from '../initializers/AppProviders.tsx'
import { configJsonUrl } from '../initializers/config/ConfigProvider.tsx'
import { AppRouter } from '../initializers/navigation/AppRouter.tsx'

import { RoutePlaceholder } from './components/RoutePlaceholder.tsx'
import { mockConfig, mockRawConfig } from './mocks/mockConfig.ts'
import { mockUrl } from './mocks/mockUrl.ts'

interface RenderAppParams {
  /** The content of `env.<mode>.json` the app loads: `mockRawConfig` when left out. */
  rawConfig?: Record<string, unknown>
  /** The HTTP status `env.<mode>.json` is answered with: 200 when left out. */
  configStatus?: number
}

/** Answers the config the app starts by loading, and puts the page of the tests at `path`. */
const openPage = (path: string, params?: RenderAppParams): void => {
  nock(mockUrl)
    .get(configJsonUrl)
    .reply(params?.configStatus ?? 200, params?.rawConfig ?? mockRawConfig)

  window.history.replaceState(null, '', `${new URL(mockConfig.APP_URL).pathname}${path}`)
}

/**
 * Renders the whole app, as the page does, opened at `path`.
 *
 * `path` is a path below `APP_URL`, with its query string (`'/logs?logSearch=text'`). Everything
 * is real, the screens the app navigates to included: only the network is mocked, so mock the
 * requests of every screen it goes through. It is for what must look like the real app, such as a
 * snapshot: to test what a screen does, use `renderFakeRouterApp`.
 *
 * The app starts by loading its config, which is answered here: wait for what the screen displays
 * with a `findBy…` query.
 *
 * ```tsx
 * nock(mockConfig.API_URL).get('/logs').query(true).reply(200, logs)
 *
 * const screen = renderRealRouterApp('/logs')
 *
 * await screen.findByText(logs[0].message)
 * expect(screen.asFragment()).toMatchSnapshot()
 * ```
 */
export const renderRealRouterApp = (path: string, params?: RenderAppParams): RenderResult => {
  openPage(path, params)

  return render(<App />)
}

/**
 * Renders the app opened at `path`, with the screen of that path as the only real one.
 *
 * It is the app of `renderRealRouterApp`, its providers and its router included, but any other
 * screen is replaced by an empty box with the test id `getRouteTestId` gives. The test of a screen
 * therefore never renders the screens it navigates to, nor mocks their requests: it checks where
 * the app went. Read the path the app is at with `getAppPath`.
 *
 * ```tsx
 * nock(mockConfig.API_URL).get('/auth/status').reply(200, { status: 'authenticated' })
 *
 * const screen = renderFakeRouterApp('/auth')
 *
 * expect(await screen.findByTestId(getRouteTestId('/logs'))).toBeInTheDocument()
 * ```
 */
export const renderFakeRouterApp = (path: string, params?: RenderAppParams): RenderResult => {
  openPage(path, params)

  const testedPathname = new URL(path, mockUrl).pathname

  return render(
    <AppProviders>
      <AppRouter
        buildRouteElement={(route) =>
          matchPath(route.path, testedPathname) !== null ? route.screen : <RoutePlaceholder />
        }
      />
    </AppProviders>
  )
}
