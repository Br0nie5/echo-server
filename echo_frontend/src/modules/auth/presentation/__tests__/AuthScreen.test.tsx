import { needsSignupMessage, type AuthToken } from '@echo/utilities'
import { waitFor, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import nock from 'nock'
import type * as ReactRouter from 'react-router-dom'
import type { Location, NavigateFunction, NavigateOptions, To } from 'react-router-dom'
import { vi, describe, expect, beforeEach } from 'vitest'

import i18n from '../../../../shared/i18n/i18n'
import type { AppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { AppPathNames } from '../../../../shared/navigation/pathNames'
import { renderApp } from '../../../../test/renderApp'
import { mockConfig } from '../../../../test/utils/mockConfig'
import { resizeWindow } from '../../../../test/utils/resizeWindow'
import type { AuthCheckResult } from '../../domain/auth.repository'
import { AuthScreen } from '../AuthScreen'

const appTranslation: AppTranslation = (key) => i18n.t(key)

/** How the app navigates to a path. */
type NavigateToPath = (to: To, options?: NavigateOptions) => void

/** The `navigate` a test gives in place of the one of the router, which is used when left out. */
const navigation = vi.hoisted(() => ({
  navigateOverride: undefined as NavigateToPath | undefined
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const reactRouter = await importOriginal<typeof ReactRouter>()

  return {
    ...reactRouter,
    useNavigate: (): NavigateFunction => {
      const navigate = reactRouter.useNavigate()
      // NavigateFunction is overloaded: the app only navigates to paths, the one call it is given.
      return (navigation.navigateOverride as NavigateFunction | undefined) ?? navigate
    }
  }
})

const onLocationChange = vi.fn<(location: Location) => void>()

/** The path the router is at, below `APP_URL`, with its query string. */
const getCurrentPath = (): string | undefined => {
  const location = onLocationChange.mock.lastCall?.[0]
  return location && `${location.pathname}${location.search}`
}

beforeEach(() => {
  vi.clearAllMocks()
  navigation.navigateOverride = undefined

  vi.resetModules()
})

const buildRequestMockScope = (): nock.Scope => {
  return nock(mockConfig.API_URL)
}

const buildLoginRequestMock = (status: number, response: AuthToken): void => {
  buildRequestMockScope().post('/auth/login').reply(status, response)
}

const buildSignUpRequestMock = (status: number, response: AuthToken): void => {
  buildRequestMockScope().post('/auth/signup').reply(status, response)
}

const buildAuthCheckRequestMock = (): nock.Interceptor => {
  return buildRequestMockScope().get('/auth/check').query({})
}

const buildAuthCheckSuccessRequestMock = (): void => {
  const authToken: AuthToken = { success: true }

  buildAuthCheckRequestMock().reply(200, authToken)
}

const buildAuthCheckNeedLoginErrorRequestMock = (): void => {
  const authToken: AuthToken = { success: false, message: 'Invalid Token' }

  buildAuthCheckRequestMock().reply(401, authToken)
}

const buildAuthCheckNeedSignUpErrorRequestMock = (): void => {
  const authToken: AuthToken = { success: false, message: needsSignupMessage }

  buildAuthCheckRequestMock().reply(401, authToken)
}

const buildAuthCheckErrorRequestMock = (statusCode: number = 400): void => {
  buildAuthCheckRequestMock().reply(statusCode, { statusCode, message: 'random error' })
}

type RenderAuthScreenParams = { pathname?: string }

const renderAuthScreen = async (
  authCheckMode: AuthCheckResult | 'error',
  params?: RenderAuthScreenParams
): Promise<RenderResult> => {
  let textToFind: string | undefined

  switch (authCheckMode) {
    case 'redirect':
      buildAuthCheckSuccessRequestMock()
      break
    case 'login':
      textToFind = appTranslation('auth.login.button')
      buildAuthCheckNeedLoginErrorRequestMock()
      break
    case 'signUp':
      textToFind = appTranslation('auth.signUp.button')
      buildAuthCheckNeedSignUpErrorRequestMock()
      break
    case 'error':
      textToFind = appTranslation('query.error')
      buildAuthCheckErrorRequestMock()
      break
  }

  const screen = await renderApp(AppPathNames.auth, <AuthScreen />, params?.pathname, {
    onLocationChange
  })

  if (textToFind === undefined) {
    await waitFor(() =>
      expect(onLocationChange.mock.lastCall?.[0].pathname).not.toBe(AppPathNames.auth)
    )
  } else {
    await screen.findByText(textToFind)
  }

  return screen
}

describe('AuthScreen', () => {
  test('Should render correctly', async () => {
    resizeWindow(1200, 600)

    const screen = await renderAuthScreen('login')

    screen.getByText(appTranslation('auth.wall'), { exact: false })

    expect(screen.asFragment()).toMatchSnapshot()
  })

  test('Should display error when submitting with empty fields', async () => {
    const user = userEvent.setup()

    const screen = await renderAuthScreen('login')

    const loginButton = screen.getByText(appTranslation('auth.login.button'))
    await user.click(loginButton)

    await screen.findByText(appTranslation('auth.form.fieldsRequired'))

    expect(screen.getByText(appTranslation('auth.form.fieldsRequired'))).toBeInTheDocument()
  })

  describe('Login', () => {
    test('Should call the API and redirect to the protected resource on successful login', async () => {
      const user = userEvent.setup()

      const redirectPath = '/logs?logSearch=status'
      const usernameInput = 'test-user'
      const passwordInput = 'test-pass'

      buildLoginRequestMock(200, { success: true, message: 'Login successful.' })

      const screen = await renderAuthScreen('login', {
        pathname: `?redirect=${encodeURIComponent(redirectPath)}`
      })

      await user.type(screen.getByLabelText(appTranslation('auth.form.username')), usernameInput)
      await user.type(screen.getByLabelText(appTranslation('auth.form.password')), passwordInput)

      const loginButton = screen.getByText(appTranslation('auth.login.button'))
      await user.click(loginButton)

      await waitFor(() => expect(getCurrentPath()).toBe(redirectPath))
    })

    test('Should call the API and redirect to the logs screen on successful login', async () => {
      const user = userEvent.setup()

      const usernameInput = 'test-user'
      const passwordInput = 'test-pass'

      buildLoginRequestMock(200, { success: true, message: 'Login successful.' })

      const screen = await renderAuthScreen('login')

      await user.type(screen.getByLabelText(appTranslation('auth.form.username')), usernameInput)
      await user.type(screen.getByLabelText(appTranslation('auth.form.password')), passwordInput)

      const loginButton = screen.getByText(appTranslation('auth.login.button'))

      await user.click(loginButton)

      await waitFor(() => expect(getCurrentPath()).toBe(AppPathNames.logs))
    })

    test('Should call the API and display an error message on failed login', async () => {
      const user = userEvent.setup()

      const usernameInput = 'bad-user'
      const passwordInput = 'bad-pass'

      buildLoginRequestMock(404, { success: false, message: 'An error occurred.' })

      const screen = await renderAuthScreen('login')

      await user.type(screen.getByLabelText(appTranslation('auth.form.username')), usernameInput)
      await user.type(screen.getByLabelText(appTranslation('auth.form.password')), passwordInput)

      const loginButton = screen.getByText(appTranslation('auth.login.button'))
      await user.click(loginButton)

      await screen.findByText(appTranslation('auth.error'))

      expect(getCurrentPath()).toBe(AppPathNames.auth)
    })

    test('Should call the API and display a specific error message on failed login (401)', async () => {
      const user = userEvent.setup()

      const usernameInput = 'bad-user'
      const passwordInput = 'bad-pass'

      buildLoginRequestMock(401, { success: false, message: 'Invalid credentials.' })

      const screen = await renderAuthScreen('login')

      await user.type(screen.getByLabelText(appTranslation('auth.form.username')), usernameInput)
      await user.type(screen.getByLabelText(appTranslation('auth.form.password')), passwordInput)

      const loginButton = screen.getByText(appTranslation('auth.login.button'))
      await user.click(loginButton)

      await screen.findByText(appTranslation('auth.login.invalidCredentials'))

      expect(getCurrentPath()).toBe(AppPathNames.auth)
    })
  })

  describe('SignUp', () => {
    test('Should call the API and redirect to the protected resource on successful sign up', async () => {
      const user = userEvent.setup()

      const redirectPath = '/logs?logSearch=status'
      const usernameInput = 'test-user'
      const passwordInput = 'test-pass'

      buildSignUpRequestMock(200, { success: true, message: 'Login successful.' })

      const screen = await renderAuthScreen('signUp', {
        pathname: `?redirect=${encodeURIComponent(redirectPath)}`
      })

      await user.type(screen.getByLabelText(appTranslation('auth.form.username')), usernameInput)
      await user.type(screen.getByLabelText(appTranslation('auth.form.password')), passwordInput)

      const signUpButton = screen.getByText(appTranslation('auth.signUp.button'))
      await user.click(signUpButton)

      await waitFor(() => expect(getCurrentPath()).toBe(redirectPath))
    })

    test('Should call the API and redirect to the logs screen on successful sign up', async () => {
      const user = userEvent.setup()

      const usernameInput = 'test-user'
      const passwordInput = 'test-pass'

      buildSignUpRequestMock(200, { success: true, message: 'Login successful.' })

      const screen = await renderAuthScreen('signUp')

      await user.type(screen.getByLabelText(appTranslation('auth.form.username')), usernameInput)
      await user.type(screen.getByLabelText(appTranslation('auth.form.password')), passwordInput)

      const signUpButton = screen.getByText(appTranslation('auth.signUp.button'))

      await user.click(signUpButton)

      await waitFor(() => expect(getCurrentPath()).toBe(AppPathNames.logs))
    })

    test('Should call the API and display an error message on failed sign up', async () => {
      const user = userEvent.setup()

      const usernameInput = 'bad-user'
      const passwordInput = 'bad-pass'

      buildSignUpRequestMock(404, { success: false, message: 'An error occurred.' })

      const screen = await renderAuthScreen('signUp')

      await user.type(screen.getByLabelText(appTranslation('auth.form.username')), usernameInput)
      await user.type(screen.getByLabelText(appTranslation('auth.form.password')), passwordInput)

      const signUpButton = screen.getByText(appTranslation('auth.signUp.button'))
      await user.click(signUpButton)

      await screen.findByText(appTranslation('auth.error'))

      expect(getCurrentPath()).toBe(AppPathNames.auth)
    })
  })

  describe('Redirection', () => {
    test('Should directly redirect to the protected resource if already authenticated', async () => {
      const redirectPath = '/logs?logSearch=status'

      await renderAuthScreen('redirect', {
        pathname: `?redirect=${encodeURIComponent(redirectPath)}`
      })

      expect(getCurrentPath()).toBe(redirectPath)
    })

    test('Should redirect to the logs screen instead of a redirection outside of the app', async () => {
      await renderAuthScreen('redirect', {
        pathname: `?redirect=${encodeURIComponent('https://elsewhere.com/')}`
      })

      expect(getCurrentPath()).toBe(AppPathNames.logs)
    })

    test('Should directly redirect to the logs screen if no redirection is provided', async () => {
      await renderAuthScreen('redirect')

      expect(getCurrentPath()).toBe(AppPathNames.logs)
    })

    test('Should redirect by clicking on the redirect button', async () => {
      const user = userEvent.setup()

      // A redirect that goes nowhere, as when it did not work: the screen stays, with its button.
      const navigate = vi.fn<NavigateToPath>()
      navigation.navigateOverride = navigate

      buildAuthCheckSuccessRequestMock()
      const screen = await renderApp(AppPathNames.auth, <AuthScreen />)

      const redirectButton = await screen.findByText(appTranslation('auth.redirect.button'))

      expect(navigate).toHaveBeenCalledExactlyOnceWith(AppPathNames.logs, { replace: true })

      await user.click(redirectButton)

      expect(navigate).toHaveBeenNthCalledWith(2, AppPathNames.logs, { replace: true })
    })
  })

  test('Should retry auth check if clicking on error page refetch button', async () => {
    const user = userEvent.setup()

    const screen = await renderAuthScreen('error')

    const refetchButton = screen.getByText(appTranslation('query.refetchButton'))

    buildAuthCheckNeedLoginErrorRequestMock()

    await user.click(refetchButton)

    await screen.findByText(appTranslation('auth.login.button'))
  })
})
