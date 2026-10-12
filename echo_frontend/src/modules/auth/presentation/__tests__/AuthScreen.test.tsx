import { needsSignupMessage, type AuthToken } from '@echo/utilities'
import type { RenderResult } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import nock from 'nock'

import { mockConfig } from '../../../../test/mocks/mockConfig'
import { renderFakeRouterApp, renderRealRouterApp } from '../../../../test/renderApp'
import { appTranslation } from '../../../../test/utils/appTranslation'
import { getRouteTestId } from '../../../../test/utils/getRouteTestId'
import { resizeWindow } from '../../../../test/utils/resizeWindow'

const credentials = { username: 'admin', password: 'secret' }

const notLoggedInAuthToken: AuthToken = { success: false, message: 'Not logged in.' }
const noAccountYetAuthToken: AuthToken = { success: false, message: needsSignupMessage }

type TranslationKey = Parameters<typeof appTranslation>[0]

const mockAuthCheckRequest = (status: number, answer: unknown): void => {
  nock(mockConfig.API_URL).get('/auth/check').reply(status, answer)
}

const mockLoginRequest = (status: number, answer: unknown): void => {
  nock(mockConfig.API_URL).post('/auth/login', credentials).reply(status, answer)
}

const mockSignUpRequest = (status: number, answer: unknown): void => {
  nock(mockConfig.API_URL).post('/auth/signup', credentials).reply(status, answer)
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
    mockAuthCheckRequest(401, notLoggedInAuthToken)

    const screen = renderRealRouterApp('/auth')

    await screen.findByText(appTranslation('auth.login.button'))

    expect(screen.asFragment()).toMatchSnapshot()
  })

  test('Should let the user retry if the authentication check failed', async () => {
    const user = userEvent.setup()
    mockAuthCheckRequest(500, { statusCode: 500, message: 'Some error.' })

    const screen = renderFakeRouterApp('/auth')

    expect(await screen.findByText(appTranslation('query.error'))).toBeInTheDocument()

    mockAuthCheckRequest(401, notLoggedInAuthToken)

    await user.click(screen.getByText(appTranslation('query.refetchButton')))

    expect(await screen.findByText(appTranslation('auth.login.button'))).toBeInTheDocument()
  })

  test('Should redirect the user if he is already authenticated', async () => {
    mockAuthCheckRequest(200, { success: true })

    const screen = renderFakeRouterApp(
      `/auth?${new URLSearchParams({ redirect: '/logs?logSearch=stock' })}`
    )

    expect(await screen.findByTestId(getRouteTestId('/logs?logSearch=stock'))).toBeInTheDocument()
  })

  test('Should show the user whether its login was successful', async () => {
    const user = userEvent.setup()
    mockAuthCheckRequest(401, notLoggedInAuthToken)

    const screen = renderFakeRouterApp('/auth')

    mockLoginRequest(401, { success: false, message: 'Invalid credentials.' })
    await typeCredentials(user, screen)
    await submit(user, screen, 'auth.login.button')

    expect(
      await screen.findByText(appTranslation('auth.login.invalidCredentials'))
    ).toBeInTheDocument()

    mockLoginRequest(500, { statusCode: 500, message: 'Some error.' })
    await submit(user, screen, 'auth.login.button')

    expect(await screen.findByText(appTranslation('auth.error'))).toBeInTheDocument()

    mockLoginRequest(200, { success: true })
    await submit(user, screen, 'auth.login.button')

    // The message is only displayed until the app has navigated, which it does at once: finding
    // it is the check, as it is already gone when an assertion looks at it.
    await screen.findByText(appTranslation('auth.login.success'))
    expect(await screen.findByTestId(getRouteTestId('/logs'))).toBeInTheDocument()
  })

  test('Should let the user create an account and tell him whether its signup was successful', async () => {
    const user = userEvent.setup()
    mockAuthCheckRequest(401, noAccountYetAuthToken)

    const screen = renderFakeRouterApp('/auth')

    await submit(user, screen, 'auth.signUp.button')

    expect(await screen.findByText(appTranslation('auth.form.fieldsRequired'))).toBeInTheDocument()

    mockSignUpRequest(200, { success: true })
    await typeCredentials(user, screen)
    await submit(user, screen, 'auth.signUp.button')

    // The message is only displayed until the app has navigated, which it does at once: finding
    // it is the check, as it is already gone when an assertion looks at it.
    await screen.findByText(appTranslation('auth.signUp.success'))
    expect(await screen.findByTestId(getRouteTestId('/logs'))).toBeInTheDocument()
  })
})
