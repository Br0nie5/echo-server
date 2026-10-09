import type { LogCategory } from '@echo/utilities'
import { logSearchSuggestions } from '@echo/utilities'
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
  availableLogCategories: LogCategory[] | undefined
  logCategoriesFiltersState: ControlledState<LogCategory[]>
  logSearchState: ControlledState<string>
}

const LogsScreenHeaderComponent: React.FC<LogsScreenHeaderProps> = ({
  logsFromDateState,
  availableLogCategories,
  logCategoriesFiltersState,
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
      {!!availableLogCategories && availableLogCategories.length > 0 && (
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
              {translation('logs.filterByCategory')}
            </Typography>
            <FilterChips
              tags={availableLogCategories}
              mode="multi-select"
              controlledState={logCategoriesFiltersState}
            />
          </Box>
          <SearchBar
            suggestions={logSearchSuggestions}
            placeholder={translation('logs.searchPlaceholder')}
            controlledState={logSearchState}
          />
        </Stack>
      )}
    </>
  )
}

/** Header of the logs page: the start date picker (limited to the last `LOGS_MINIMAL_DATE_DAYS_AGO` days of the config), the server name and, once categories are available, the category chips and the search bar. */
export const LogsScreenHeader = memo(LogsScreenHeaderComponent)
