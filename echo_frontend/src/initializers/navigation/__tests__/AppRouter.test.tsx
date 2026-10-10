import type { JSX } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderComponent } from '../../../test/renderComponent'
import { testConfig } from '../../../test/utils/config'
import { AppRouter } from '../AppRouter'

const authTestId = 'auth-screen'
vi.mock('../../../modules/auth/presentation/AuthScreen', () => ({
  AuthScreen: (): JSX.Element => <div data-testid={authTestId} />
}))

const logsTestId = 'logs-screen'
vi.mock('../../../modules/logs/presentation/LogsScreen', () => ({
  LogsScreen: (): JSX.Element => <div data-testid={logsTestId} />
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AppRouter', () => {
  it('Should render AuthScreen if HAS_AUTHENTICATION is true', async () => {
    const screen = await renderComponent(<AppRouter />, {
      configOverride: { ...testConfig, HAS_AUTHENTICATION: true }
    })

    expect(await screen.findByTestId(authTestId)).toBeInTheDocument()
    expect(screen.queryByTestId(logsTestId)).not.toBeInTheDocument()
  })

  it('Should render LogsScreen if HAS_AUTHENTICATION is false', async () => {
    const screen = await renderComponent(<AppRouter />, {
      configOverride: { ...testConfig, HAS_AUTHENTICATION: false }
    })

    expect(await screen.findByTestId(logsTestId)).toBeInTheDocument()
    expect(screen.queryByTestId(authTestId)).not.toBeInTheDocument()
  })
})
