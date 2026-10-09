import { isLogCategory, type LogCategory } from '@echo/utilities'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { ControlledState } from '../../../../shared/types/controlledState'
import { getDateFromDaysAgo } from '../../../../shared/utils/getDateFromDaysAgo'
import { parseDateQueryParam } from '../utils/parseDateQueryParam'

/** How many days back the logs start when the URL gives no `fromDate`. */
export const LOGS_INITIAL_DAYS_AGO = 2

interface UseLogsFiltersReturnType {
  logsFromDateState: ControlledState<Date>
  logCategoriesFiltersState: ControlledState<LogCategory[]>
  logSearchState: ControlledState<string>
}

/** The logs filters chosen by the user, initialized from and mirrored to the URL query params. A `fromDate` param that is not a date is replaced by the default start of the logs. */
export const useLogsFilters = (): UseLogsFiltersReturnType => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [logsFromDate, setLogsFromDate] = useState<Date>(
    () =>
      parseDateQueryParam(searchParams.get('fromDate')) ?? getDateFromDaysAgo(LOGS_INITIAL_DAYS_AGO)
  )
  const logsFromDateState = useMemo<ControlledState<Date>>(
    () => ({ value: logsFromDate, setValue: setLogsFromDate }),
    [logsFromDate]
  )

  const [logCategoriesFilters, setLogCategoriesFilters] = useState<LogCategory[]>(
    searchParams.getAll('logCategories').filter(isLogCategory)
  )
  const logCategoriesFiltersState = useMemo<ControlledState<LogCategory[]>>(
    () => ({ value: logCategoriesFilters, setValue: setLogCategoriesFilters }),
    [logCategoriesFilters]
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
    logCategoriesFilters.forEach((logCategoryFilter) =>
      params.append('logCategories', logCategoryFilter)
    )

    setSearchParams(params, { replace: true })
  }, [logsFromDate, logSearch, logCategoriesFilters, setSearchParams])

  return { logsFromDateState, logCategoriesFiltersState, logSearchState }
}
