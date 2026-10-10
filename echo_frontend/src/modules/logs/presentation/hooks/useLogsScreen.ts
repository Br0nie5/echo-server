import {
  parseLogSearchInput,
  type Log,
  type LogCategory,
  type LogSearchFilter
} from '@echo/utilities'
import type { QueryStatus } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { ControlledState } from '../../../../shared/types/controlledState'
import { useGetLogs } from '../../application/useGetLogs'
import { sortLogCategories } from '../utils/sortLogCategories'

import { useLogsFilters } from './useLogsFilters'

interface UseLogsScreenReturnType {
  logs: Log[] | undefined
  logsStatus: QueryStatus
  refetchLogs: () => void
  logsFromDateState: ControlledState<Date>
  availableLogCategories: LogCategory[] | undefined
  logCategoriesFiltersState: ControlledState<LogCategory[]>
  logSearchState: ControlledState<string>
  logSearchFilters: LogSearchFilter[]
}

/** Data and filters of the logs screen. Only the date is applied by the backend; categories and search are applied client-side (see `useFilteredLogs`), and the available categories are those found in the fetched logs plus the selected ones. */
export const useLogsScreen = (): UseLogsScreenReturnType => {
  const { logsFromDateState, logCategoriesFiltersState, logSearchState } = useLogsFilters()

  const {
    data: logs,
    status: logsStatus,
    refetch: refetchLogs
  } = useGetLogs({ fromDate: logsFromDateState.value.toISOString() })

  const availableLogCategories = useMemo(() => {
    if (logs === undefined) {
      return undefined
    }
    const logCategoriesFromLogs = logs.map((log) => log.category)
    const logCategoriesFromFilters = logCategoriesFiltersState.value

    const combinedLogCategories = Array.from(
      new Set([...logCategoriesFromLogs, ...logCategoriesFromFilters])
    ).sort(sortLogCategories)

    return combinedLogCategories
  }, [logs, logCategoriesFiltersState.value])

  const logSearchFilters = useMemo(() => {
    return parseLogSearchInput(logSearchState.value)
  }, [logSearchState.value])

  return {
    logs,
    logsStatus,
    refetchLogs,
    logsFromDateState,
    availableLogCategories,
    logCategoriesFiltersState,
    logSearchState,
    logSearchFilters
  }
}
