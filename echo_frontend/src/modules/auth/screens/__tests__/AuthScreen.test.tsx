import { needsSignupMessage, type AuthToken } from '@echo/utilities'
import { type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Interceptor, Scope } from 'nock'
import nock from 'nock'
import type { Mock } from 'vitest'
import { vi, describe, expect, beforeEach, beforeAll } from 'vitest'

import i18n from '../../../../shared/i18n/i18n'
import type { AppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { AppPathNames } from '../../../../shared/navigation/pathNames'
import { renderApp } from '../../../../test/renderApp'
import { testEnv } from '../../../../test/utils/env'
import { resizeWindow } from '../../../../test/utils/resizeWindow'
import { getAuthCheckQueryKey } from '../../infra/keys/getAuthCheckQueryKey'
import { postLoginMutationKey } from '../../infra/keys/postLoginMutationKey'
import { postSignUpMutationKey } from '../../infra/keys/postSignUpMutationKey'
import type { AuthCheckResult } from '../../infra/useGetAuthCheck'
import { AuthScreen } from '../AuthScreen'

const appTranslation: AppTranslation = (key) => i18n.t(key)

let mockSetHref: Mock

beforeAll(() => {
  mockSetHref = vi.fn()
  const originalLocation = window.location

  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...originalLocation, href: originalLocation.href }
  })
  Object.defineProperty(window.location, 'href', {
    set: mockSetHref,
    get: () => originalLocation.href,
    configurable: true
  })
})

beforeEach(() => {
  vi.clearAllMocks()

  Object.defineProperty(window.location, 'search', {
    value: '',
    writable: true,
    configurable: true
  })

  vi.resetModules()
})

const buildRequestMockScope = (): Scope => {
  return nock(testEnv.API_URL)
}

const buildLoginRequestMock = (status: number, response: AuthToken): void => {
  const loginUri = postLoginMutationKey[0]
  buildRequestMockScope().post(loginUri).reply(status, response)
}

const buildSignUpRequestMock = (status: number, response: AuthToken): void => {
  const signUpUri = postSignUpMutationKey[0]
  buildRequestMockScope().post(signUpUri).reply(status, response)
}

const buildAuthCheckRequestMock = (): Interceptor => {
  const authCheckUri = getAuthCheckQueryKey[0]

  return buildRequestMockScope().get(authCheckUri).query({})
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
  let textToFind: string

  switch (authCheckMode) {
    case 'redirect':
      textToFind = appTranslation('auth.redirect.button')
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

  const screen = await renderApp(AppPathNames.auth, <AuthScreen />, params?.pathname)

  await screen.findByText(textToFind)

  return screen
}

describe('AuthScreen', () => {
  describe('AuthForm', () => {
    test('Should render correctly', async () => {
      resizeWindow(1200, 600)

      const screen = await renderAuthScreen('login')

      screen.getByText(appTranslation('auth.wall'), { exact: false })

      expect(screen.asFragment()).toMatchSnapshot()
    })

    test('should display error when submitting with empty fields', async () => {
      const user = userEvent.setup()

      const screen = await renderAuthScreen('login')

      const loginButton = screen.getByText(appTranslation('auth.login.button'))
      await user.click(loginButton)

      await screen.findByText(appTranslation('auth.form.fieldsRequired'))

      expect(screen.getByText(appTranslation('auth.form.fieldsRequired'))).toBeInTheDocument()
    })
  })

  describe('AuthLogin', () => {
    test('should call the API and redirect to the protected resource on successful login', async () => {
      const user = userEvent.setup()

      const redirectUrl = 'https://logs.test.cc/status'
      const usernameInput = 'test-user'
      const passwordInput = 'test-pass'

      buildLoginRequestMock(200, { success: true, message: 'Login successful.' })

      const screen = await renderAuthScreen('login', {
        pathname: `?redirect=${encodeURIComponent(redirectUrl)}`
      })

      await user.type(screen.getByLabelText(appTranslation('auth.form.username')), usernameInput)
      await user.type(screen.getByLabelText(appTranslation('auth.form.password')), passwordInput)

      const loginButton = screen.getByText(appTranslation('auth.login.button'))
      await user.click(loginButton)

      await screen.findByText(appTranslation('auth.login.success'))

      expect(mockSetHref).toHaveBeenCalledExactlyOnceWith(redirectUrl)
    })

    test('should call the API and display the children screen on successful login', async () => {
      const user = userEvent.setup()

      const usernameInput = 'test-user'
      const passwordInput = 'test-pass'

      buildLoginRequestMock(200, { success: true, message: 'Login successful.' })

      const screen = await renderAuthScreen('login')

      await user.type(screen.getByLabelText(appTranslation('auth.form.username')), usernameInput)
      await user.type(screen.getByLabelText(appTranslation('auth.form.password')), passwordInput)

      const loginButton = screen.getByText(appTranslation('auth.login.button'))

      await user.click(loginButton)

      await screen.findByText(appTranslation('auth.login.success'))

      expect(mockSetHref).toHaveBeenCalledExactlyOnceWith(`${testEnv.APP_URL}/logs`)
    })

    test('should call the API and display an error message on failed login', async () => {
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

      expect(mockSetHref).not.toHaveBeenCalled()
    })

    test('should call the API and display a specific error message on failed login (401)', async () => {
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

      expect(mockSetHref).not.toHaveBeenCalled()
    })
  })

  describe('AuthSignUp', () => {
    test('should call the API and redirect to the protected resource on successful sign up', async () => {
      const user = userEvent.setup()

      const redirectUrl = 'https://logs.test.cc/status'
      const usernameInput = 'test-user'
      const passwordInput = 'test-pass'

      buildSignUpRequestMock(200, { success: true, message: 'Login successful.' })

      const screen = await renderAuthScreen('signUp', {
        pathname: `?redirect=${encodeURIComponent(redirectUrl)}`
      })

      await user.type(screen.getByLabelText(appTranslation('auth.form.username')), usernameInput)
      await user.type(screen.getByLabelText(appTranslation('auth.form.password')), passwordInput)

      const signUpButton = screen.getByText(appTranslation('auth.signUp.button'))
      await user.click(signUpButton)

      await screen.findByText(appTranslation('auth.signUp.success'))

      expect(mockSetHref).toHaveBeenCalledExactlyOnceWith(redirectUrl)
    })

    test('should call the API and display the children screen on successful sign up', async () => {
      const user = userEvent.setup()

      const usernameInput = 'test-user'
      const passwordInput = 'test-pass'

      buildSignUpRequestMock(200, { success: true, message: 'Login successful.' })

      const screen = await renderAuthScreen('signUp')

      await user.type(screen.getByLabelText(appTranslation('auth.form.username')), usernameInput)
      await user.type(screen.getByLabelText(appTranslation('auth.form.password')), passwordInput)

      const signUpButton = screen.getByText(appTranslation('auth.signUp.button'))

      await user.click(signUpButton)

      await screen.findByText(appTranslation('auth.signUp.success'))

      expect(mockSetHref).toHaveBeenCalledExactlyOnceWith(`${testEnv.APP_URL}/logs`)
    })

    test('should call the API and display an error message on failed sign up', async () => {
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

      expect(mockSetHref).not.toHaveBeenCalled()
    })
  })

  describe('Redirection', () => {
    test('should directly redirect to the protected resource if already authenticated', async () => {
      const redirectUrl = 'https://logs.test.cc/status'

      await renderAuthScreen('redirect', {
        pathname: `?redirect=${encodeURIComponent(redirectUrl)}`
      })

      expect(mockSetHref).toHaveBeenCalledExactlyOnceWith(redirectUrl)
    })

    test('should directly redirect to the env logs url if no redirection is provided', async () => {
      await renderAuthScreen('redirect')

      expect(mockSetHref).toHaveBeenCalledExactlyOnceWith(`${testEnv.APP_URL}/logs`)
    })

    test('should redirect by clicking on the redirect button', async () => {
      const user = userEvent.setup()

      const screen = await renderAuthScreen('redirect')

      expect(mockSetHref).toHaveBeenCalledExactlyOnceWith(`${testEnv.APP_URL}/logs`)

      const redirectButton = screen.getByText(appTranslation('auth.redirect.button'))
      await user.click(redirectButton)

      expect(mockSetHref).toHaveBeenNthCalledWith(2, `${testEnv.APP_URL}/logs`)
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
