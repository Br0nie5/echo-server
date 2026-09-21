import type { AuthToken } from '@echo/utilities'
import type { UseMutateFunction } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { useCallback } from 'react'

import { useAppTranslation, type AppTranslation } from '../../../../shared/i18n/useAppTranslation'
import type { PostAuthParams } from '../../infra/usePostAuth'
import type { OnFormSubmitType } from '../utils/types'

import { useRedirectionOnAuth } from './useRedirectionOnAuth'

type TranslationKey = Parameters<AppTranslation>[0]

interface UseAuthSubmitParams<TRequest> {
  mutate: UseMutateFunction<
    AuthToken,
    AxiosError<AuthToken, PostAuthParams<TRequest>>,
    PostAuthParams<TRequest>
  >
  successMessageKey: TranslationKey
  getErrorMessageKey: (error: AxiosError<AuthToken, PostAuthParams<TRequest>>) => TranslationKey
}

/** Turns an auth mutation into a form submit handler: alert on success/error, then redirect. */
export const useAuthSubmit = <TRequest extends { username: string; password: string }>({
  mutate,
  successMessageKey,
  getErrorMessageKey
}: UseAuthSubmitParams<TRequest>): OnFormSubmitType => {
  const translation = useAppTranslation()

  const { redirectOnAuth } = useRedirectionOnAuth()

  return useCallback(
    ({ username, password, setAlert }) => {
      mutate(
        { data: { username, password } as TRequest },
        {
          onSuccess: () => {
            setAlert({ severity: 'success', message: translation(successMessageKey) })
            redirectOnAuth()
          },
          onError: (error) => {
            setAlert({ severity: 'error', message: translation(getErrorMessageKey(error)) })
          }
        }
      )
    },
    [mutate, translation, successMessageKey, getErrorMessageKey, redirectOnAuth]
  )
}
