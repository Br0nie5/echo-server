import {
  AuthTokenSchema,
  needsSignupMessage,
  type AuthToken,
  type LoginRequest,
  type SignUpRequest
} from '@echo/utilities'
import axios, { type AxiosError } from 'axios'

import { useApiMutator } from '../../../shared/api/useApiMutator'
import {
  InvalidCredentialsError,
  type AuthCheckResult,
  type AuthRepository
} from '../domain/auth.repository'

const authCheckUrl = '/auth/check'
const loginUrl = '/auth/login'
const signUpUrl = '/auth/signup'

const isUnauthorizedError = (error: unknown): error is AxiosError<AuthToken> =>
  axios.isAxiosError<AuthToken>(error) && error.response?.status === 401

/**
 * The `AuthRepository` on top of the auth endpoints of the backend.
 *
 * Every answer is validated against `AuthTokenSchema`. A 401 is how the backend refuses, and no
 * caller gets to see it: the auth check reads it as a result (`signUp` when the backend says no
 * account exists yet, `login` otherwise), and the login throws an `InvalidCredentialsError`.
 *
 * ```ts
 * const authRepository = useAuthRepository()
 * const authCheckResult = await authRepository.checkAuthentication()
 * ```
 */
export const useAuthRepository = (): AuthRepository => {
  const axiosMutator = useApiMutator()

  const postCredentials = async <TRequest>(url: string, request: TRequest): Promise<void> => {
    const data = await axiosMutator<AuthToken, unknown, TRequest>({
      url,
      method: 'POST',
      data: request
    })

    AuthTokenSchema.parse(data)
  }

  return {
    checkAuthentication: async (signal?: AbortSignal): Promise<AuthCheckResult> => {
      try {
        const data = await axiosMutator<AuthToken>({
          url: authCheckUrl,
          method: 'GET',
          signal,
          withCredentials: true
        })
        const parsedData = AuthTokenSchema.safeParse(data)
        if (!parsedData.success) {
          throw new Error('Invalid auth token format')
        }
        return 'redirect'
      } catch (error) {
        if (isUnauthorizedError(error)) {
          const parsedBody = AuthTokenSchema.safeParse(error.response?.data)
          return parsedBody.success && parsedBody.data.message === needsSignupMessage
            ? 'signUp'
            : 'login'
        }

        throw error
      }
    },
    login: async (request: LoginRequest): Promise<void> => {
      try {
        await postCredentials(loginUrl, request)
      } catch (error) {
        if (isUnauthorizedError(error)) {
          throw new InvalidCredentialsError()
        }

        throw error
      }
    },
    signUp: (request: SignUpRequest) => postCredentials(signUpUrl, request)
  }
}
