import type { Log, LogLevel, LogSearchFilter } from '@echo/utilities'
import { Box, LinearProgress } from '@mui/material'
import { memo } from 'react'

import { useFilteredLogs } from '../../application/useFilteredLogs'

import { LogsByDaysLayout } from './LogsByDaysLayout'

type FilteredLogsLayoutProps = {
  logs: Log[]
  logLevelsFilters: LogLevel[]
  logSearchFilters: LogSearchFilter[]
}

const FilteredLogsLayoutComponent: React.FC<FilteredLogsLayoutProps> = ({
  logs,
  logLevelsFilters,
  logSearchFilters
}) => {
  const { data, isFetching: isFilteringLogs } = useFilteredLogs(
    logs,
    logLevelsFilters,
    logSearchFilters
  )

  const filteredLogs = data ?? logs

  return (
    <Box style={{ position: 'relative', paddingTop: isFilteringLogs ? '5px' : '0px' }}>
      {isFilteringLogs && (
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
      <LogsByDaysLayout filteredLogs={filteredLogs} />
    </Box>
  )
}

/**
 * The logs matching the level and search filters, with a progress bar while they are filtered.
 *
 * Every log is displayed until the first result is ready.
 */
export const FilteredLogsLayout = memo(FilteredLogsLayoutComponent)
