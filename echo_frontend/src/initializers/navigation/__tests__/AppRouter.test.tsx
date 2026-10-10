import type { JSX } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderComponent } from '../../../test/renderComponent'
import { mockConfig } from '../../../test/utils/mockConfig'
import { AppRouter } from '../AppRouter'

const authTestId = 'auth-screen'
vi.mock('../../../modules/auth/presentation/AuthScreen', () => ({
  AuthScreen: (): JSX.Element => <div data-testid={authTestId} />
}))

const logsTestId = 'logs-screen'
vi.mock('../../../modules/logs/presentation/LogsScreen', () => ({
  LogsScreen: (): JSX.Element => <div data-testid={logsTestId} />
}))

beforeEach(() => {
  // The backend only serves the page below the path of APP_URL, the basename of the router.
  window.history.replaceState(null, '', `${new URL(mockConfig.APP_URL).pathname}/`)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AppRouter', () => {
  it('Should render AuthScreen if HAS_AUTHENTICATION is true', async () => {
    const screen = await renderComponent(<AppRouter />, {
      configOverride: { ...mockConfig, HAS_AUTHENTICATION: true }
    })

    expect(await screen.findByTestId(authTestId)).toBeInTheDocument()
    expect(screen.queryByTestId(logsTestId)).not.toBeInTheDocument()
  })

  it('Should render LogsScreen if HAS_AUTHENTICATION is false', async () => {
    const screen = await renderComponent(<AppRouter />, {
      configOverride: { ...mockConfig, HAS_AUTHENTICATION: false }
    })

    expect(await screen.findByTestId(logsTestId)).toBeInTheDocument()
    expect(screen.queryByTestId(authTestId)).not.toBeInTheDocument()
  })
})
