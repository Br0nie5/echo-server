import type { GetLogsParams, Log } from '@echo/utilities'
import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query'

import { useLogsRepository } from '../infra/useLogsRepository'

/**
 * Query giving the logs matching `params`, each `params` having its own cache entry.
 *
 * While the logs of new `params` are fetched, its data is the logs of the previous ones, with
 * `isPlaceholderData` set.
 */
export function useGetLogs(params: GetLogsParams): UseQueryResult<Log[]> {
  const logsRepository = useLogsRepository()

  return useQuery({
    queryKey: ['logs', params],
    queryFn: ({ signal }) => logsRepository.findLogs(params, signal),
    placeholderData: keepPreviousData
  })
}
