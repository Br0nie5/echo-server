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
    isFetchingLogs,
    refetchLogs,
    logsFromDateState,
    availableLogLevels,
    logLevelsFiltersState,
    logSearchState,
    logSearchFilters
  } = useLogsScreen()

  const translation = useAppTranslation()

  useScreenTitle(translation('logs.title'))

  const header = (
    <LogsScreenHeader
      logsFromDateState={logsFromDateState}
      availableLogLevels={availableLogLevels}
      logLevelsFiltersState={logLevelsFiltersState}
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
        isFetchingLogs={isFetchingLogs}
        logLevelsFilters={logLevelsFiltersState.value}
        logSearchFilters={logSearchFilters}
      />
    </PageLayout>
  )
}

/**
 * The logs screen.
 *
 * It displays the header with the filters, and the logs once fetched: a spinner, a message or an
 * error otherwise.
 */
export const LogsScreen = memo(LogsScreenComponent)
