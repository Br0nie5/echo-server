import { AuthTokenSchema, needsSignupMessage, type AuthToken } from '@echo/utilities'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import axios, { type AxiosError } from 'axios'

import { useApiMutator } from '../../../shared/api/useApiMutator'

import { getAuthCheckQueryKey, type GetAuthCheckQueryKeyType } from './keys/getAuthCheckQueryKey'

/** What to do after the auth check: `redirect` (already authenticated), `login` or `signUp` (no account yet). */
export type AuthCheckResult = 'redirect' | 'login' | 'signUp'

/** Asks the backend whether the user is authenticated. A 401 is a regular result (`login` or `signUp`), other errors are thrown. */
export function useGetAuthCheck(): UseQueryResult<AuthCheckResult, AxiosError<AuthToken>> {
  const axiosMutator = useApiMutator()

  const queryKey = getAuthCheckQueryKey
  const [url, method] = queryKey

  const query = useQuery<
    AuthCheckResult,
    AxiosError<AuthToken>,
    AuthCheckResult,
    GetAuthCheckQueryKeyType
  >({
    queryKey: queryKey,
    queryFn: async ({ signal }): Promise<AuthCheckResult> => {
      try {
        const data = await axiosMutator<AuthToken>({ url, method, signal, withCredentials: true })
        const parsedData = AuthTokenSchema.safeParse(data)
        if (!parsedData.success) {
          throw new Error('Invalid auth token format')
        }
        return 'redirect'
      } catch (err) {
        if (axios.isAxiosError<AuthToken>(err)) {
          if (err.response?.status === 401) {
            const parsedBody = AuthTokenSchema.safeParse(err.response?.data)
            return parsedBody.success && parsedBody.data.message === needsSignupMessage
              ? 'signUp'
              : 'login'
          }
        }

        throw err
      }
    }
  })

  return query
}
