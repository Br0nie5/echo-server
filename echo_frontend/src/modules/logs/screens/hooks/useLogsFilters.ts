import { isLogCategory, type LogCategory } from '@echo/utilities'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { ControlledState } from '../../../../shared/types/controlledState'
import { getLogsInitialDate } from '../utils/getLogsDates'

interface UseLogsFiltersReturnType {
  logsFromDateState: ControlledState<string>
  logCategoriesFiltersState: ControlledState<LogCategory[]>
  logSearchState: ControlledState<string>
}

/** The logs filters chosen by the user, initialized from and mirrored to the URL query params. */
export const useLogsFilters = (): UseLogsFiltersReturnType => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [logsFromDate, setLogsFromDate] = useState<string>(
    searchParams.get('fromDate') ?? getLogsInitialDate()
  )
  const logsFromDateState = useMemo<ControlledState<string>>(
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

    params.append('fromDate', logsFromDate)

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
