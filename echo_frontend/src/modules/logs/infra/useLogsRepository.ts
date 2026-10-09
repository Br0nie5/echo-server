import { LogArraySchema, type GetLogsParams, type Log } from '@echo/utilities'

import { interceptUnauthenticatedError } from '../../../shared/api/interceptors'
import { useApiMutator } from '../../../shared/api/useApiMutator'
import { useConfig } from '../../../shared/config/useConfig'
import type { LogsRepository } from '../domain/logs.repository'

import { filterLogs } from './workers/filterLogs'

const logsUrl = '/logs'

/**
 * The `LogsRepository` on top of the logs endpoint of the backend and of the filter worker of the app.
 *
 * The logs are fetched from the backend: the answer is validated against `LogArraySchema`, and a
 * 401 sends the user to the auth screen, before the error is thrown. They are filtered away from
 * the main thread, with the same functions as the backend.
 *
 * ```ts
 * const logsRepository = useLogsRepository()
 * const logs = await logsRepository.findLogs({ fromDate: '2026-04-26T00:00:00.000Z' })
 * const errorLogs = await logsRepository.filterLogs(logs, ['ERROR'], [])
 * ```
 */
export const useLogsRepository = (): LogsRepository => {
  const axiosMutator = useApiMutator()
  const config = useConfig()

  return {
    findLogs: async (params: GetLogsParams, signal?: AbortSignal): Promise<Log[]> => {
      const data = await axiosMutator<Log[], GetLogsParams>({
        url: logsUrl,
        method: 'GET',
        params,
        signal,
        withCredentials: true,
        errorInterceptor: (error) => interceptUnauthenticatedError(error, config)
      })

      return LogArraySchema.parse(data)
    },
    filterLogs
  }
}
