import { isLogCategory, type LogCategory } from '@echo/utilities'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { getLogsInitialDate } from '../utils/getLogsDates'

interface UseLogsFiltersReturnType {
  logsFromDate: string
  setLogsFromDate: (date: string) => void
  logCategoriesFilters: LogCategory[]
  setLogCategoriesFilters: (categories: LogCategory[]) => void
  logSearch: string
  setLogSearch: (search: string) => void
}

/** The logs filters chosen by the user, initialised from and mirrored to the URL query params. */
export const useLogsFilters = (): UseLogsFiltersReturnType => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [logsFromDate, setLogsFromDate] = useState<string>(
    searchParams.get('fromDate') ?? getLogsInitialDate()
  )
  const [logCategoriesFilters, setLogCategoriesFilters] = useState<LogCategory[]>(
    searchParams.getAll('logCategories').filter(isLogCategory)
  )
  const [logSearch, setLogSearch] = useState<string>(searchParams.get('logSearch') ?? '')

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

  return {
    logsFromDate,
    setLogsFromDate,
    logCategoriesFilters,
    setLogCategoriesFilters,
    logSearch,
    setLogSearch
  }
}
