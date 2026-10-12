import {
  AuthStatusSchema,
  type AuthStatus,
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

const authStatusUrl = '/auth/status'
const loginUrl = '/auth/login'
const signUpUrl = '/auth/signup'

const authCheckResultsByStatus: Record<AuthStatus['status'], AuthCheckResult> = {
  authenticated: 'redirect',
  unauthenticated: 'login',
  needsSignUp: 'signUp'
}

/**
 * Gives the `AuthRepository` on top of the auth endpoints of the API.
 *
 * The auth check validates the answer of the API against `AuthStatusSchema`, throwing when it does
 * not match, and gives the `AuthCheckResult` of its status. The login and the sign up succeed when
 * the API accepts the request, whatever it answers with. A 401 is how the API refuses credentials,
 * and no caller gets to see it: the login throws an `InvalidCredentialsError`.
 *
 * ```ts
 * const authRepository = useAuthRepository()
 * const authCheckResult = await authRepository.checkAuthentication()
 * ```
 */
export const useAuthRepository = (): AuthRepository => {
  const sendApiRequest = useSendApiRequest()

  const postCredentials = <TRequest>(url: string, request: TRequest): Promise<void> =>
    sendApiRequest<void, unknown, TRequest>({ url, method: 'POST', data: request })

  return {
    checkAuthentication: async (signal?: AbortSignal): Promise<AuthCheckResult> => {
      const data = await sendApiRequest<AuthStatus>({
        url: authStatusUrl,
        method: 'GET',
        signal,
        withCredentials: true
      })

      return authCheckResultsByStatus[AuthStatusSchema.parse(data).status]
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
