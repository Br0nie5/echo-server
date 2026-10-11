import { parseLogSearchInput, type Log, type LogLevel, type LogSearchFilter } from '@echo/utilities'
import type { QueryStatus } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { ControlledState } from '../../../../shared/types/controlledState'
import { useGetLogs } from '../../application/useGetLogs'
import { sortLogLevels } from '../utils/sortLogLevels'

import { useLogsFilters } from './useLogsFilters'

interface UseLogsScreenReturnType {
  logs: Log[] | undefined
  logsStatus: QueryStatus
  refetchLogs: () => void
  logsFromDateState: ControlledState<Date>
  availableLogLevels: LogLevel[] | undefined
  logLevelsFiltersState: ControlledState<LogLevel[]>
  logSearchState: ControlledState<string>
  logSearchFilters: LogSearchFilter[]
}

/** Data and filters of the logs screen. Only the date is applied by the backend; levels and search are applied client-side (see `useFilteredLogs`), and the available levels are those found in the fetched logs plus the selected ones. */
export const useLogsScreen = (): UseLogsScreenReturnType => {
  const { logsFromDateState, logLevelsFiltersState, logSearchState } = useLogsFilters()

  const {
    data: logs,
    status: logsStatus,
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
    ).sort(sortLogLevels)

    return combinedLogLevels
  }, [logs, logLevelsFiltersState.value])

  const logSearchFilters = useMemo(() => {
    return parseLogSearchInput(logSearchState.value)
  }, [logSearchState.value])

  return {
    logs,
    logsStatus,
    refetchLogs,
    logsFromDateState,
    availableLogLevels,
    logLevelsFiltersState,
    logSearchState,
    logSearchFilters
  }
}
