import type { GetLogsParams } from '@echo/utilities'

/** Query key of the logs: `[url, method, params]`. */
export type LogsQueryKeyType = readonly ['/logs', 'GET', GetLogsParams]

/** The query key of the logs for these params, so each date has its own cache entry. */
export const getGetLogsQueryKey = (params: GetLogsParams): LogsQueryKeyType => {
  return [`/logs`, 'GET', params] as const
}
