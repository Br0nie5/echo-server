import type { LogCategory } from '@echo/utilities'
import { logSearchSuggestions } from '@echo/utilities'
import { Box, Stack, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import { memo } from 'react'

import { FilterChips } from '../../../../shared/components/FilterChips'
import { useConfig } from '../../../../shared/config/useConfig'
import { useWindowSize } from '../../../../shared/hooks/useWindowSize'
import { useAppTranslation } from '../../../../shared/i18n/useAppTranslation'
import type { ControlledState } from '../../../../shared/types/controlledState'
import { getLogsMaximalDate, getLogsMinimalDate } from '../utils/getLogsDates'

import { SearchBar } from './SearchBar'

type LogsScreenHeaderProps = {
  logsFromDateState: ControlledState<string>
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
  const { SERVER_NAME } = useConfig()

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
        <DatePicker
          label={translation('logs.from')}
          sx={{ flexShrink: 1 }}
          value={dayjs(logsFromDateState.value)}
          minDate={dayjs(getLogsMinimalDate())}
          maxDate={dayjs(getLogsMaximalDate())}
          onChange={(value) => {
            const newDate = value?.toDate()
            if (newDate !== undefined) {
              newDate.setHours(0, 0, 0, 0)
              logsFromDateState.setValue(newDate.toISOString())
            }
          }}
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
            initialInputValue={logSearchState.value}
            onSearch={logSearchState.setValue}
          />
        </Stack>
      )}
    </>
  )
}

/** Header of the logs page: the start date picker (limited to the last 14 days), the server name and, once categories are available, the category chips and the search bar. */
export const LogsScreenHeader = memo(LogsScreenHeaderComponent)
