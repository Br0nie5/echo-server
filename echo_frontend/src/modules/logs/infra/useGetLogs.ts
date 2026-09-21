import { LogArraySchema, type GetLogsParams, type Log } from '@echo/utilities'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import { interceptUnauthenticatedError } from '../../../shared/api/interceptors'
import { useApiMutator } from '../../../shared/api/useApiMutator'
import { useEnv } from '../../../shared/env/useEnv'

import { getGetLogsQueryKey, type LogsQueryKeyType } from './getLogsQueryKey'

/** Fetches the logs from `params.fromDate`, validating the answer. A 401 redirects to the auth screen. */
export function useGetLogs(
  params: GetLogsParams
): UseQueryResult<Log[], AxiosError<Log[], GetLogsParams>> {
  const axiosMutator = useApiMutator()
  const env = useEnv()

  const queryKey = getGetLogsQueryKey(params)
  const [url, method] = queryKey

  const query = useQuery<Log[], AxiosError<Log[], GetLogsParams>, Log[], LogsQueryKeyType>({
    queryKey: queryKey,
    queryFn: async ({ signal }) => {
      const data = await axiosMutator<Log[], GetLogsParams>({
        url,
        method,
        params,
        signal,
        withCredentials: true,
        errorInterceptor: (error: AxiosError): void => interceptUnauthenticatedError(error, env)
      })

      return LogArraySchema.parse(data)
    }
  })

  return query
}
