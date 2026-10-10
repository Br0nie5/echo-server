import { LogArraySchema, type GetLogsParams, type Log } from '@echo/utilities'

import { useSendApiRequest } from '../../../shared/api/useSendApiRequest'
import type { LogsRepository } from '../domain/logs.repository'

import { filterLogs } from './workers/filterLogs'

const logsUrl = '/logs'

/**
 * The `LogsRepository` on top of the logs endpoint of the backend and of the filter worker of the app.
 *
 * The logs are fetched from the backend, through `useSendApiRequest` (which sends the user to the
 * auth screen when they are not authenticated), and the answer is validated against
 * `LogArraySchema`. They are filtered away from the main thread, with the same functions as the
 * backend.
 *
 * ```ts
 * const logsRepository = useLogsRepository()
 * const logs = await logsRepository.findLogs({ fromDate: '2026-04-26T00:00:00.000Z' })
 * const errorLogs = await logsRepository.filterLogs(logs, ['ERROR'], [])
 * ```
 */
export const useLogsRepository = (): LogsRepository => {
  const sendApiRequest = useSendApiRequest()

  return {
    findLogs: async (params: GetLogsParams, signal?: AbortSignal): Promise<Log[]> => {
      const data = await sendApiRequest<Log[], GetLogsParams>({
        url: logsUrl,
        method: 'GET',
        params,
        signal,
        withCredentials: true
      })

      return LogArraySchema.parse(data)
    },
    filterLogs
  }
}
