import type { LogLevel } from '@echo/utilities'
import { logSearchableKeys } from '@echo/utilities'
import { Box, Stack, Typography } from '@mui/material'
import { memo } from 'react'

import { DateSelector } from '../../../../shared/components/DateSelector'
import { FilterChips } from '../../../../shared/components/FilterChips'
import { SearchBar } from '../../../../shared/components/SearchBar'
import { useConfig } from '../../../../shared/config/useConfig'
import { useWindowSize } from '../../../../shared/hooks/useWindowSize'
import { useAppTranslation } from '../../../../shared/i18n/useAppTranslation'
import type { ControlledState } from '../../../../shared/types/controlledState'
import { getDateFromDaysAgo } from '../../../../shared/utils/getDateFromDaysAgo'

type LogsScreenHeaderProps = {
  logsFromDateState: ControlledState<Date>
  availableLogLevels: LogLevel[] | undefined
  logLevelsFiltersState: ControlledState<LogLevel[]>
  logSearchState: ControlledState<string>
}

const LogsScreenHeaderComponent: React.FC<LogsScreenHeaderProps> = ({
  logsFromDateState,
  availableLogLevels,
  logLevelsFiltersState,
  logSearchState
}) => {
  const { SERVER_NAME, LOGS_MINIMAL_DATE_DAYS_AGO } = useConfig()

  const translation = useAppTranslation()
  const { isSmallScreen } = useWindowSize()

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <DateSelector
          label={translation('logs.from')}
          minimalDate={getDateFromDaysAgo(LOGS_MINIMAL_DATE_DAYS_AGO)}
          maximalDate={getDateFromDaysAgo(0)}
          controlledState={logsFromDateState}
        />
      </Box>
      <Typography variant="h4" gutterBottom align="center" sx={{ mt: 3 }}>
        {`${SERVER_NAME}: ${translation('logs.viewer')}`}
      </Typography>
      {!!availableLogLevels && availableLogLevels.length > 0 && (
        <Stack
          direction={isSmallScreen ? 'column' : 'row'}
          spacing={isSmallScreen ? 2 : 7}
          sx={{
            padding: 2,
            justifyContent: isSmallScreen ? undefined : 'space-between'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" align="center" sx={{ mb: 3 }}>
              {translation('logs.filterByLevel')}
            </Typography>
            <FilterChips
              tags={availableLogLevels}
              mode="multi-select"
              controlledState={logLevelsFiltersState}
            />
          </Box>
          <SearchBar
            suggestions={logSearchableKeys}
            placeholder={translation('logs.searchPlaceholder')}
            controlledState={logSearchState}
          />
        </Stack>
      )}
    </>
  )
}

/**
 * The header of the logs screen.
 *
 * It displays the picker of the date the logs start at, limited to the last
 * `LOGS_MINIMAL_DATE_DAYS_AGO` days, the name of the server and, once levels are available, the
 * level chips and the search bar.
 */
export const LogsScreenHeader = memo(LogsScreenHeaderComponent)
