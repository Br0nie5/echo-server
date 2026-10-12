import { isLogLevel, type LogLevel } from '@echo/utilities'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useConfig } from '../../../../shared/config/useConfig'
import type { ControlledState } from '../../../../shared/types/controlledState'
import { getDateFromDaysAgo } from '../../../../shared/utils/getDateFromDaysAgo'
import { parseDateQueryParam } from '../utils/parseDateQueryParam'

interface UseLogsFiltersReturnType {
  logsFromDateState: ControlledState<Date>
  logLevelsFiltersState: ControlledState<LogLevel[]>
  logSearchState: ControlledState<string>
}

/**
 * Gives the filters of the logs chosen by the user, read from the query params of the URL at first
 * and written back to them at each change.
 *
 * Without a `fromDate` param, or with one that is not a date, the logs start
 * `LOGS_INITIAL_DATE_DAYS_AGO` days ago. A `logLevels` param that is not a level is left out.
 */
export const useLogsFilters = (): UseLogsFiltersReturnType => {
  const { LOGS_INITIAL_DATE_DAYS_AGO } = useConfig()
  const [searchParams, setSearchParams] = useSearchParams()

  const [logsFromDate, setLogsFromDate] = useState<Date>(
    () =>
      parseDateQueryParam(searchParams.get('fromDate')) ??
      getDateFromDaysAgo(LOGS_INITIAL_DATE_DAYS_AGO)
  )
  const logsFromDateState = useMemo<ControlledState<Date>>(
    () => ({ value: logsFromDate, setValue: setLogsFromDate }),
    [logsFromDate]
  )

  const [logLevelsFilters, setLogLevelsFilters] = useState<LogLevel[]>(
    searchParams.getAll('logLevels').filter(isLogLevel)
  )
  const logLevelsFiltersState = useMemo<ControlledState<LogLevel[]>>(
    () => ({ value: logLevelsFilters, setValue: setLogLevelsFilters }),
    [logLevelsFilters]
  )

  const [logSearch, setLogSearch] = useState<string>(searchParams.get('logSearch') ?? '')
  const logSearchState = useMemo<ControlledState<string>>(
    () => ({ value: logSearch, setValue: setLogSearch }),
    [logSearch]
  )

  useEffect(() => {
    const params = new URLSearchParams()

    params.append('fromDate', logsFromDate.toISOString())

    if (logSearch) {
      params.set('logSearch', logSearch)
    }
    logLevelsFilters.forEach((logLevelFilter) => params.append('logLevels', logLevelFilter))

    setSearchParams(params, { replace: true })
  }, [logsFromDate, logSearch, logLevelsFilters, setSearchParams])

  return { logsFromDateState, logLevelsFiltersState, logSearchState }
}
