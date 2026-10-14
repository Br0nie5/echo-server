import type { LogLevel } from '@echo/utilities'
import { logSearchableKeys } from '@echo/utilities'
import { Box, Stack, Typography, useTheme } from '@mui/material'
import { memo } from 'react'

import { DateSelector } from '../../../../shared/components/DateSelector'
import { FilterChips } from '../../../../shared/components/FilterChips'
import { SearchBar } from '../../../../shared/components/SearchBar'
import { useConfig } from '../../../../shared/config/useConfig'
import { useWindowSize } from '../../../../shared/hooks/useWindowSize'
import { useAppTranslation } from '../../../../shared/i18n/useAppTranslation'
import type { ControlledState } from '../../../../shared/types/controlledState'

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
  const { serverName, logsMinimalDate, logsMaximalDate } = useConfig()

  const translation = useAppTranslation()
  const theme = useTheme()
  const { isPortrait } = useWindowSize()

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
          minimalDate={logsMinimalDate}
          maximalDate={logsMaximalDate}
          controlledState={logsFromDateState}
        />
      </Box>
      <Typography
        variant="h4"
        gutterBottom
        align="center"
        sx={{ mt: theme.dimensions.screenTitle.topMargin }}
      >
        {`${serverName}: ${translation('logs.title')}`}
      </Typography>
      {!!availableLogLevels && availableLogLevels.length > 0 && (
        <Stack
          direction={isPortrait ? 'column' : 'row'}
          spacing={
            isPortrait
              ? theme.dimensions.logsFilters.portraitGap
              : theme.dimensions.logsFilters.landscapeGap
          }
          sx={{
            padding: theme.dimensions.logsFilters.padding,
            justifyContent: isPortrait ? undefined : 'space-between'
          }}
        >
          <Box sx={{ mb: theme.dimensions.logsFilters.levelsBottomMargin }}>
            <Typography
              variant="h5"
              align="center"
              sx={{ mb: theme.dimensions.logsFilters.levelsTitleBottomMargin }}
            >
              {translation('logs.filterByLevel')}
            </Typography>
            <FilterChips tags={availableLogLevels} controlledState={logLevelsFiltersState} />
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
 * It displays the picker of the date the logs start at, between `logsMinimalDate` and
 * `logsMaximalDate`, the name of the server and, once levels are available, the
 * level chips and the search bar.
 */
export const LogsScreenHeader = memo(LogsScreenHeaderComponent)
