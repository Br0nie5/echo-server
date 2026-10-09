import { isLogCategory, type LogCategory } from '@echo/utilities'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useConfig } from '../../../../shared/config/useConfig'
import type { ControlledState } from '../../../../shared/types/controlledState'
import { getDateFromDaysAgo } from '../../../../shared/utils/getDateFromDaysAgo'
import { parseDateQueryParam } from '../utils/parseDateQueryParam'

interface UseLogsFiltersReturnType {
  logsFromDateState: ControlledState<Date>
  logCategoriesFiltersState: ControlledState<LogCategory[]>
  logSearchState: ControlledState<string>
}

/** The logs filters chosen by the user, initialized from and mirrored to the URL query params. Without a `fromDate` param, or with one that is not a date, the logs start `LOGS_INITIAL_DATE_DAYS_AGO` days ago, as the config says. */
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
