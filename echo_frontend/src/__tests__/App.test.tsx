import type { JSX } from 'react'

import { mockRawConfig } from '../test/mocks/mockConfig'
import { renderRealRouterApp } from '../test/renderApp'
import { appTranslation } from '../test/utils/appTranslation'
import { getAppPath } from '../test/utils/getAppPath'

// Unit tests of the app itself, its config and its routes: the screens are tested with their
// module, so they are replaced here, and a change in one of them changes nothing in this file.
const authScreenTestId = 'auth-screen'
vi.mock('../modules/auth/presentation/AuthScreen', () => ({
  AuthScreen: (): JSX.Element => <div data-testid={authScreenTestId} />
}))

const logsScreenTestId = 'logs-screen'
vi.mock('../modules/logs/presentation/LogsScreen', () => ({
  LogsScreen: (): JSX.Element => <div data-testid={logsScreenTestId} />
}))

const rawConfigWithoutAuthentication = { ...mockRawConfig, HAS_AUTHENTICATION: false }

describe('App', () => {
  describe('Config', () => {
    test.each([
      { reason: 'cannot be loaded', params: { configStatus: 500 } },
      {
        reason: 'is not valid',
        params: { rawConfig: { ...mockRawConfig, LOGS_INITIAL_DATE_DAYS_AGO: 'two' } }
      }
    ])(
      'Should display an error in place of its screens when its config $reason',
      async ({ params }) => {
        const screen = renderRealRouterApp('/logs', params)

        expect(await screen.findByText(appTranslation('query.error'))).toBeInTheDocument()
        expect(screen.queryByTestId(logsScreenTestId)).not.toBeInTheDocument()
      }
    )
  })

  describe('Routes', () => {
    test.each([
      { path: '/auth', screenTestId: authScreenTestId, openedPath: '/auth' },
      { path: '/logs', screenTestId: logsScreenTestId, openedPath: '/logs' },
      { path: '/unknown', screenTestId: authScreenTestId, openedPath: '/auth' },
      { path: '/', screenTestId: authScreenTestId, openedPath: '/auth' }
    ])(
      'Should open $openedPath at $path with authentication',
      async ({ path, screenTestId, openedPath }) => {
        const screen = renderRealRouterApp(path)

        expect(await screen.findByTestId(screenTestId)).toBeInTheDocument()
        expect(getAppPath()).toBe(openedPath)
      }
    )

    test.each(['/logs', '/auth', '/unknown', '/'])(
      'Should open /logs at %s without authentication, which has no auth screen',
      async (path) => {
        const screen = renderRealRouterApp(path, { rawConfig: rawConfigWithoutAuthentication })

        expect(await screen.findByTestId(logsScreenTestId)).toBeInTheDocument()
        expect(screen.queryByTestId(authScreenTestId)).not.toBeInTheDocument()
        expect(getAppPath()).toBe('/logs')
      }
    )
  })
})
