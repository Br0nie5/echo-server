import type { AxiosResponse, ResponseType } from 'axios'

import { useGoToAuthScreen } from '../navigation/useGoToAuthScreen'

import { isUnauthorizedError } from './isUnauthorizedError'
import { useApi } from './useApi'

/** A request sent through `useSendApiRequest`. */
interface ApiRequest<TParams = unknown, TBody = unknown> {
  /** The path of the endpoint, below `API_URL`. */
  url: string
  method: string
  /** The query params. */
  params?: TParams
  /** The body. */
  data?: TBody
  responseType?: ResponseType
  /** Aborting it cancels the request. */
  signal?: AbortSignal
  withCredentials?: boolean
}

/**
 * A function sending a request to the API through the axios instance of `ApiProvider`.
 *
 * The function returns the body of the response, and throws the axios error when the request fails.
 * When the API answers a 401, the user is not authenticated: it also navigates to the auth screen
 * (see `useGoToAuthScreen`), which brings them back once they are. It stays on the auth screen,
 * where a 401 is the answer the auth endpoints give, which the caller reads.
 *
 * Call it inside the router, which it navigates with.
 *
 * ```ts
 * const sendApiRequest = useSendApiRequest()
 * const logs = await sendApiRequest<Log[]>({ url: '/logs', method: 'GET', params })
 * ```
 */
export const useSendApiRequest = () => {
  const axiosInstance = useApi()
  const goToAuthScreen = useGoToAuthScreen()

  return async <TData, TParams = unknown, TBody = unknown>({
    url,
    method,
    params,
    data,
    responseType,
    signal,
    withCredentials
  }: ApiRequest<TParams, TBody>): Promise<TData> => {
    try {
      const response = await axiosInstance.request<TData, AxiosResponse<TData, TBody>, TBody>({
        url,
        method,
        params,
        data,
        responseType,
        signal,
        withCredentials
      })

      return response.data
    } catch (error) {
      if (isUnauthorizedError(error)) {
        goToAuthScreen()
      }

      throw error
    }
  }
}
