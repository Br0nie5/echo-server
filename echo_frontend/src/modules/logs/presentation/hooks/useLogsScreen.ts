import { parseLogSearchInput, type Log, type LogLevel, type LogSearchFilter } from '@echo/utilities'
import type { QueryStatus } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { ControlledState } from '../../../../shared/types/controlledState'
import { useGetLogs } from '../../application/useGetLogs'
import { compareLogLevels } from '../utils/compareLogLevels'

import { useLogsFilters } from './useLogsFilters'

interface UseLogsScreenReturnType {
  logs: Log[] | undefined
  logsStatus: QueryStatus
  isFetchingLogs: boolean
  refetchLogs: () => void
  logsFromDateState: ControlledState<Date>
  availableLogLevels: LogLevel[] | undefined
  logLevelsFiltersState: ControlledState<LogLevel[]>
  logSearchState: ControlledState<string>
  logSearchFilters: LogSearchFilter[]
}

/**
 * Gives the data and the filters of the logs screen.
 *
 * Only the date is given to the API: the levels and the search are applied in the app (see
 * `useFilteredLogs`). The available levels are those of the fetched logs, plus the selected ones.
 *
 * While the logs of another date are fetched, `logs` are those of the previous date, and
 * `isFetchingLogs` is `true`.
 */
export const useLogsScreen = (): UseLogsScreenReturnType => {
  const { logsFromDateState, logLevelsFiltersState, logSearchState } = useLogsFilters()

  const {
    data: logs,
    status: logsStatus,
    isFetching: isFetchingLogs,
    refetch: refetchLogs
  } = useGetLogs({ fromDate: logsFromDateState.value.toISOString() })

  const availableLogLevels = useMemo(() => {
    if (logs === undefined) {
      return undefined
    }
    const logLevelsFromLogs = logs.map((log) => log.level)
    const logLevelsFromFilters = logLevelsFiltersState.value

    const combinedLogLevels = Array.from(
      new Set([...logLevelsFromLogs, ...logLevelsFromFilters])
    ).sort(compareLogLevels)

    return combinedLogLevels
  }, [logs, logLevelsFiltersState.value])

  const logSearchFilters = useMemo(() => {
    return parseLogSearchInput(logSearchState.value)
  }, [logSearchState.value])

  return {
    logs,
    logsStatus,
    isFetchingLogs,
    refetchLogs,
    logsFromDateState,
    availableLogLevels,
    logLevelsFiltersState,
    logSearchState,
    logSearchFilters
  }
}
