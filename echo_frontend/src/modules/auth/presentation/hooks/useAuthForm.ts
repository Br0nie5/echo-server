import { useCallback, useState, type SubmitEvent } from 'react'

import { useAppTranslation, type AppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { usePostLogin } from '../../application/usePostLogin'
import { usePostSignUp } from '../../application/usePostSignUp'
import { InvalidCredentialsError } from '../../domain/auth.repository'
import type { AuthAlert, AuthenticationMode } from '../utils/types'

import { useRedirectionOnAuth } from './useRedirectionOnAuth'

type TranslationKey = Parameters<AppTranslation>[0]

const successMessageKeys: Record<AuthenticationMode, TranslationKey> = {
  login: 'auth.login.success',
  signUp: 'auth.signUp.success'
}

interface UseAuthFormReturnType {
  translation: AppTranslation
  onSubmit: (event: SubmitEvent<Element>) => void
  isSubmitting: boolean
  isAuthenticated: boolean
  alert: AuthAlert | null
  username: string
  setUsername: (username: string) => void
  password: string
  setPassword: (password: string) => void
}

/**
 * State and submit of the credentials form, for the login or the sign up depending on `formMode`.
 *
 * The submit requires both fields, then sends the credentials with the mutation of `formMode` and
 * alerts the outcome. Once authenticated (`isAuthenticated`), it redirects.
 */
export const useAuthForm = (formMode: AuthenticationMode): UseAuthFormReturnType => {
  const translation = useAppTranslation()

  const { redirectOnAuth } = useRedirectionOnAuth()

  const postLogin = usePostLogin()
  const postSignUp = usePostSignUp()
  const {
    mutate: sendCredentials,
    isPending: isSubmitting,
    isSuccess: isAuthenticated
  } = formMode === 'login' ? postLogin : postSignUp

  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [alert, setAlert] = useState<AuthAlert | null>(null)

  const onSubmit = useCallback(
    (event: SubmitEvent) => {
      event.preventDefault()
      setAlert(null)

      if (!username || !password) {
        setAlert({ severity: 'warning', message: translation('auth.form.fieldsRequired') })
        return
      }

      sendCredentials(
        { username, password },
        {
          onSuccess: () => {
            setAlert({ severity: 'success', message: translation(successMessageKeys[formMode]) })
            redirectOnAuth()
          },
          onError: (error) => {
            const errorMessageKey =
              error instanceof InvalidCredentialsError
                ? 'auth.login.invalidCredentials'
                : 'auth.error'
            setAlert({ severity: 'error', message: translation(errorMessageKey) })
          }
        }
      )
    },
    [username, password, translation, formMode, sendCredentials, redirectOnAuth]
  )

  return {
    translation,
    onSubmit,
    isSubmitting,
    isAuthenticated,
    alert,
    username,
    setUsername,
    password,
    setPassword
  }
}
