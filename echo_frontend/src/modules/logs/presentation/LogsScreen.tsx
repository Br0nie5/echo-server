import React, { memo } from 'react'

import { useScreenTitle } from '../../../shared/hooks/useScreenTitle'
import { useAppTranslation } from '../../../shared/i18n/useAppTranslation'
import { PageLayout } from '../../../shared/layouts/PageLayout'
import { QueryFallbackLayout } from '../../../shared/layouts/QueryFallbackLayout'

import { LogsScreenHeader } from './components/LogsScreenHeader'
import { useLogsScreen } from './hooks/useLogsScreen'
import { FilteredLogsLayout } from './layouts/FilteredLogsLayout'

const LogsScreenComponent: React.FC = () => {
  const {
    logs,
    logsStatus,
    refetchLogs,
    logsFromDateState,
    availableLogCategories,
    logCategoriesFiltersState,
    logSearchState,
    logSearchFilters
  } = useLogsScreen()

  const translation = useAppTranslation()

  useScreenTitle(translation('logs.viewer'))

  const header = (
    <LogsScreenHeader
      logsFromDateState={logsFromDateState}
      availableLogCategories={availableLogCategories}
      logCategoriesFiltersState={logCategoriesFiltersState}
      logSearchState={logSearchState}
    />
  )

  if (!logs || logs.length === 0) {
    return (
      <PageLayout header={header}>
        <QueryFallbackLayout status={logsStatus} refetch={refetchLogs} />
      </PageLayout>
    )
  }

  return (
    <PageLayout header={header}>
      <FilteredLogsLayout
        logs={logs}
        logCategoriesFilters={logCategoriesFiltersState.value}
        logSearchFilters={logSearchFilters}
      />
    </PageLayout>
  )
}

/** Logs page: the filters header, and the logs once fetched (or a loading, empty or error state). */
export const LogsScreen = memo(LogsScreenComponent)
