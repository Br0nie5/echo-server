import { useCallback, useState, type SubmitEvent } from 'react'

import { useAppTranslation, type AppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { usePostLogin } from '../../application/usePostLogin'
import { usePostSignUp } from '../../application/usePostSignUp'
import { InvalidCredentialsError } from '../../domain/auth.repository'
import type { AuthAlert, AuthenticationMode } from '../utils/types'

import { useRedirectionOnAuth } from './useRedirectionOnAuth'

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
 * Gives the state and the submit of the credentials form, of the login or of the sign up depending
 * on `formMode`.
 *
 * The submit sends the credentials with the mutation of `formMode`, and redirects once they are
 * accepted (`isAuthenticated`). `alert` holds the reason of a submit that did not authenticate: a
 * field left empty, in which case nothing is sent, credentials that are those of no account, or a
 * request that failed. It is emptied by the next submit.
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
          onSuccess: redirectOnAuth,
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
    [username, password, translation, sendCredentials, redirectOnAuth]
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
