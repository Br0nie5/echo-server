import type { GetLogsParams, Log } from '@echo/utilities'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { useLogsRepository } from '../infra/useLogsRepository'

/** Query giving the logs matching `params`, each `params` having its own cache entry. */
export function useGetLogs(params: GetLogsParams): UseQueryResult<Log[]> {
  const logsRepository = useLogsRepository()

  return useQuery({
    queryKey: ['logs', params],
    queryFn: ({ signal }) => logsRepository.findLogs(params, signal)
  })
}
