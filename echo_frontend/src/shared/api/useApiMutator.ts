import type { AxiosError } from 'axios'
import axios, { type AxiosResponse, type ResponseType } from 'axios'

import { useApi } from '../../initializers/api/useApi'

/** Arguments of a request made through `useApiMutator`. */
interface AxiosMutatorArgs<TParams = unknown, TBody = unknown> {
  url: string
  method: string
  params?: TParams
  data?: TBody
  responseType?: ResponseType
  signal?: AbortSignal
  withCredentials?: boolean
  errorInterceptor?: (error: AxiosError) => void
}

/** A request function returning the response body, in the shape of an orval mutator. `errorInterceptor` runs on failure, before the error is rethrown. */
export const useApiMutator = () => {
  const axiosInstance = useApi()

  return async <TData, TParams = unknown, TBody = unknown>({
    url,
    method,
    params,
    data,
    responseType,
    signal,
    withCredentials,
    errorInterceptor
  }: AxiosMutatorArgs<TParams, TBody>): Promise<TData> => {
    const source = axios.CancelToken.source()

    try {
      const response = await axiosInstance.request<TData, AxiosResponse<TData, TBody>, TBody>({
        url,
        method,
        params,
        data,
        responseType,
        signal,
        cancelToken: source.token,
        withCredentials
      })

      return response.data
    } catch (error) {
      // Handled per call: registering it on the shared axios instance would also run it for
      // any other request in flight at the same time.
      errorInterceptor?.(error as AxiosError)
      throw error
    }
  }
}
