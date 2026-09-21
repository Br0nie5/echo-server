import { useCallback, useState, type SubmitEvent } from 'react'

import { useAppTranslation, type AppTranslation } from '../../../../shared/i18n/useAppTranslation'
import type { AuthAlert, OnFormSubmitType } from '../utils/types'

interface UseAuthFormReturnType {
  translation: AppTranslation
  onSubmit: (event: SubmitEvent<Element>) => void
  alert: AuthAlert | null
  username: string
  setUsername: (username: string) => void
  password: string
  setPassword: (username: string) => void
}

/** State of the credentials form: the fields, the alert, and a submit handler that requires both fields before calling `onFormSubmit`. */
export const useAuthForm = (onFormSubmit: OnFormSubmitType): UseAuthFormReturnType => {
  const translation = useAppTranslation()

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

      onFormSubmit({ username, password, setAlert })
    },
    [username, password, translation, onFormSubmit]
  )

  return {
    translation,
    onSubmit,
    alert,
    username,
    setUsername,
    password,
    setPassword
  }
}
