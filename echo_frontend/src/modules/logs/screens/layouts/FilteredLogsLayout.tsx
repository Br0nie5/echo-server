import type { Log, LogCategory, LogSearchFilter } from '@echo/utilities'
import { Box, LinearProgress } from '@mui/material'
import { memo } from 'react'

import { useFilteredLogs } from '../../infra/useFilteredLogs'

import { LogsByDaysLayout } from './LogsByDaysLayout'

type FilteredLogsLayoutProps = {
  logs: Log[]
  logCategoriesFilters: LogCategory[]
  logSearchFilters: LogSearchFilter[]
}

const FilteredLogsLayoutComponent: React.FC<FilteredLogsLayoutProps> = ({
  logs,
  logCategoriesFilters,
  logSearchFilters
}) => {
  const { data, isFetching: isFilteringLogs } = useFilteredLogs(
    logs,
    logCategoriesFilters,
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

/** Logs filtered by categories and search, with a progress bar while filtering. Shows every log until the first result is ready. */
export const FilteredLogsLayout = memo(FilteredLogsLayoutComponent)
