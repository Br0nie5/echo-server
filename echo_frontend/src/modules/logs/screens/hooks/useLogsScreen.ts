import {
  parseLogSearchInput,
  type Log,
  type LogCategory,
  type LogSearchFilter
} from '@echo/utilities'
import type { QueryStatus } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useGetLogs } from '../../infra/useGetLogs'
import { combineLogCategories } from '../utils/combineLogCategories'
import { extractLogsLogCategories } from '../utils/extractLogsLogCategories'

import { useLogsFilters } from './useLogsFilters'

interface UseLogsScreenReturnType {
  logs: Log[] | undefined
  logsStatus: QueryStatus
  refetchLogs: () => void
  logsFromDate: string
  setLogsFromDate: (date: string) => void
  availableLogCategories: LogCategory[] | undefined
  logCategoriesFilters: LogCategory[]
  setLogCategoriesFilters: (categories: LogCategory[]) => void
  logSearch: string
  setLogSearch: (search: string) => void
  logSearchFilters: LogSearchFilter[]
}

/** Data and filters of the logs screen. Only the date is applied by the backend; categories and search are applied client-side (see `useFilteredLogs`), and the available categories are those found in the fetched logs plus the selected ones. */
export const useLogsScreen = (): UseLogsScreenReturnType => {
  const {
    logsFromDate,
    setLogsFromDate,
    logCategoriesFilters,
    setLogCategoriesFilters,
    logSearch,
    setLogSearch
  } = useLogsFilters()

  const {
    data: logs,
    status: logsStatus,
    refetch: refetchLogs
  } = useGetLogs({ fromDate: logsFromDate })

  const availableLogCategories = useMemo(() => {
    return logs !== undefined
      ? combineLogCategories(extractLogsLogCategories(logs), logCategoriesFilters)
      : undefined
  }, [logs, logCategoriesFilters])

  const logSearchFilters = useMemo(() => {
    return parseLogSearchInput(logSearch)
  }, [logSearch])

  return {
    logs,
    logsStatus,
    refetchLogs,
    logsFromDate,
    setLogsFromDate,
    availableLogCategories,
    logCategoriesFilters,
    setLogCategoriesFilters,
    logSearch,
    setLogSearch,
    logSearchFilters
  }
}
