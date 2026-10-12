import {
  AuthTokenSchema,
  needsSignupMessage,
  type AuthToken,
  type LoginRequest,
  type SignUpRequest
} from '@echo/utilities'

import { isUnauthorizedError } from '../../../shared/api/isUnauthorizedError'
import { useSendApiRequest } from '../../../shared/api/useSendApiRequest'
import {
  InvalidCredentialsError,
  type AuthCheckResult,
  type AuthRepository
} from '../domain/auth.repository'

const authCheckUrl = '/auth/check'
const loginUrl = '/auth/login'
const signUpUrl = '/auth/signup'

/**
 * Gives the `AuthRepository` on top of the auth endpoints of the API.
 *
 * Every answer is validated against `AuthTokenSchema`. A 401 is how the API refuses, and no caller
 * gets to see it: the auth check reads it as a result (`signUp` when its message is
 * `needsSignupMessage`, `login` otherwise), and the login throws an `InvalidCredentialsError`.
 *
 * ```ts
 * const authRepository = useAuthRepository()
 * const authCheckResult = await authRepository.checkAuthentication()
 * ```
 */
export const useAuthRepository = (): AuthRepository => {
  const sendApiRequest = useSendApiRequest()

  const postCredentials = async <TRequest>(url: string, request: TRequest): Promise<void> => {
    const data = await sendApiRequest<AuthToken, unknown, TRequest>({
      url,
      method: 'POST',
      data: request
    })

    AuthTokenSchema.parse(data)
  }

  return {
    checkAuthentication: async (signal?: AbortSignal): Promise<AuthCheckResult> => {
      try {
        const data = await sendApiRequest<AuthToken>({
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
        if (isUnauthorizedError<AuthToken>(error)) {
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
