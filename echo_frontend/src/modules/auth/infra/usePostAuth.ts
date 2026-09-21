import { AuthTokenSchema, type AuthToken } from '@echo/utilities'
import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import { useApiMutator } from '../../../shared/api/useApiMutator'

/** `[url, method]` of the endpoint. */
export type PostAuthMutationKey = readonly [url: string, method: string]
/** Variables of an auth mutation: the credentials and an optional abort signal. */
export type PostAuthParams<TRequest> = { data: TRequest; signal?: AbortSignal }
/** Result of the auth mutations: resolves with the `AuthToken` answer of the backend. */
export type PostAuthResult<TRequest> = UseMutationResult<
  AuthToken,
  AxiosError<AuthToken, PostAuthParams<TRequest>>,
  PostAuthParams<TRequest>
>

/** Shared by every endpoint that takes credentials and answers with an auth token. */
export const usePostAuth = <TRequest>(
  mutationKey: PostAuthMutationKey
): PostAuthResult<TRequest> => {
  const axiosMutator = useApiMutator()
  const [url, method] = mutationKey

  return useMutation<
    AuthToken,
    AxiosError<AuthToken, PostAuthParams<TRequest>>,
    PostAuthParams<TRequest>,
    PostAuthMutationKey
  >({
    mutationKey,
    mutationFn: async (params) => {
      const data = await axiosMutator<AuthToken, unknown, TRequest>({
        url,
        method,
        data: params.data,
        signal: params.signal
      })

      return AuthTokenSchema.parse(data)
    }
  })
}
