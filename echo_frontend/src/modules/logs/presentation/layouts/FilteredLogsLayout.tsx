import type { Log, LogLevel, LogSearchFilter } from '@echo/utilities'
import { Box, LinearProgress } from '@mui/material'
import { memo } from 'react'

import { NoDataLayout } from '../../../../shared/layouts/NoDataLayout'
import { useFilteredLogs } from '../../application/useFilteredLogs'

import { LogsByDaysLayout } from './LogsByDaysLayout'

type FilteredLogsLayoutProps = {
  logs: Log[]
  /** Whether `logs` are being fetched again, those of another date for example. */
  isFetchingLogs: boolean
  logLevelsFilters: LogLevel[]
  logSearchFilters: LogSearchFilter[]
}

const FilteredLogsLayoutComponent: React.FC<FilteredLogsLayoutProps> = ({
  logs,
  isFetchingLogs,
  logLevelsFilters,
  logSearchFilters
}) => {
  const { data, isFetching: isFilteringLogs } = useFilteredLogs(
    logs,
    logLevelsFilters,
    logSearchFilters
  )

  const filteredLogs = data ?? logs
  const isLoading = isFetchingLogs || isFilteringLogs

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        paddingTop: isLoading ? '5px' : '0px'
      }}
    >
      {isLoading && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1
          }}
        />
      )}
      {filteredLogs.length > 0 ? (
        <LogsByDaysLayout filteredLogs={filteredLogs} />
      ) : (
        <NoDataLayout />
      )}
    </Box>
  )
}

/**
 * The logs matching the level and search filters, with a progress bar while they are fetched or
 * filtered.
 *
 * Every log is displayed until the first result is ready, then the previous result until the next
 * one is, and a message when no log matches.
 */
export const FilteredLogsLayout = memo(FilteredLogsLayoutComponent)
