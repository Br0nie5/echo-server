import type { AuthStatus } from '@echo/utilities'
import type { RenderResult } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import nock from 'nock'

import type { TranslationKey } from '../../../../shared/i18n/useAppTranslation'
import { mockConfig } from '../../../../test/mocks/mockConfig'
import { renderFakeRouterApp, renderRealRouterApp } from '../../../../test/renderApp'
import { appTranslation } from '../../../../test/utils/appTranslation'
import { getRouteTestId } from '../../../../test/utils/getRouteTestId'
import { resizeWindow } from '../../../../test/utils/resizeWindow'

const credentials = { username: 'admin', password: 'secret' }

const authenticatedStatus: AuthStatus = { status: 'authenticated' }
const notLoggedInStatus: AuthStatus = { status: 'unauthenticated' }
const noAccountYetStatus: AuthStatus = { status: 'needsSignUp' }

const mockAuthStatusRequest = (statusCode: number, answer: unknown): void => {
  nock(mockConfig.API_URL).get('/auth/status').reply(statusCode, answer)
}

const mockLoginRequest = (statusCode: number, answer?: object): void => {
  nock(mockConfig.API_URL).post('/auth/login', credentials).reply(statusCode, answer)
}

const mockSignUpRequest = (statusCode: number, answer?: object): void => {
  nock(mockConfig.API_URL).post('/auth/signup', credentials).reply(statusCode, answer)
}

const typeCredentials = async (user: UserEvent, screen: RenderResult): Promise<void> => {
  await user.type(
    await screen.findByLabelText(appTranslation('auth.form.username')),
    credentials.username
  )
  await user.type(screen.getByLabelText(appTranslation('auth.form.password')), credentials.password)
}

const submit = async (
  user: UserEvent,
  screen: RenderResult,
  submitButtonKey: TranslationKey
): Promise<void> => {
  await user.click(await screen.findByText(appTranslation(submitButtonKey)))
}

beforeEach(() => {
  resizeWindow(1200, 600)
})

describe('AuthScreen', () => {
  test('Should display the login form to the user who is not logged in', async () => {
    mockAuthStatusRequest(200, notLoggedInStatus)

    const screen = renderRealRouterApp('/auth')

    await screen.findByText(appTranslation('auth.login.button'))

    expect(screen.asFragment()).toMatchSnapshot()
  })

  test('Should let the user retry if the authentication check failed', async () => {
    const user = userEvent.setup()
    mockAuthStatusRequest(500, { statusCode: 500, message: 'Some error.' })

    const screen = renderFakeRouterApp('/auth')

    expect(await screen.findByText(appTranslation('query.error'))).toBeInTheDocument()

    mockAuthStatusRequest(200, notLoggedInStatus)

    await user.click(screen.getByText(appTranslation('query.refetchButton')))

    expect(await screen.findByText(appTranslation('auth.login.button'))).toBeInTheDocument()
  })

  test('Should redirect the user who is already authenticated', async () => {
    mockAuthStatusRequest(200, authenticatedStatus)

    const screen = renderFakeRouterApp(
      `/auth?${new URLSearchParams({ redirect: '/logs?logSearch=stock' })}`
    )

    expect(await screen.findByTestId(getRouteTestId('/logs?logSearch=stock'))).toBeInTheDocument()
  })

  test('Should tell the user whether their login was successful', async () => {
    const user = userEvent.setup()
    mockAuthStatusRequest(200, notLoggedInStatus)

    const screen = renderFakeRouterApp('/auth')

    mockLoginRequest(401, { statusCode: 401, message: 'Invalid credentials.' })
    await typeCredentials(user, screen)
    await submit(user, screen, 'auth.login.button')

    expect(
      await screen.findByText(appTranslation('auth.login.invalidCredentials'))
    ).toBeInTheDocument()

    mockLoginRequest(500, { statusCode: 500, message: 'Some error.' })
    await submit(user, screen, 'auth.login.button')

    expect(await screen.findByText(appTranslation('auth.error'))).toBeInTheDocument()

    mockLoginRequest(204)
    await submit(user, screen, 'auth.login.button')

    expect(await screen.findByTestId(getRouteTestId('/logs'))).toBeInTheDocument()
  })

  test('Should let the user create an account, and tell them whether their sign up was successful', async () => {
    const user = userEvent.setup()
    mockAuthStatusRequest(200, noAccountYetStatus)

    const screen = renderFakeRouterApp('/auth')

    await submit(user, screen, 'auth.signUp.button')

    expect(await screen.findByText(appTranslation('auth.form.fieldsRequired'))).toBeInTheDocument()

    mockSignUpRequest(204)
    await typeCredentials(user, screen)
    await submit(user, screen, 'auth.signUp.button')

    expect(await screen.findByTestId(getRouteTestId('/logs'))).toBeInTheDocument()
  })
})
