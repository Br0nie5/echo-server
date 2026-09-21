import type { Log } from '@echo/utilities'
import { Stack, Typography } from '@mui/material'
import { memo } from 'react'

import { useAppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { formatDate } from '../../../../shared/utils/formatDate'
import { LogsBox } from '../components/LogsBox'
import { useLogsByDaysLayout } from '../hooks/useLogsByDaysLayout'

import { LogsByGroupsLayout } from './LogsByGroupsLayout'

type LogsByDaysLayoutProps = {
  filteredLogs: Log[]
}

const LogsByDaysLayoutComponent: React.FC<LogsByDaysLayoutProps> = ({ filteredLogs }) => {
  const translation = useAppTranslation()
  const { logsByDays } = useLogsByDaysLayout(filteredLogs)

  return (
    <Stack spacing={2} sx={{ overflowX: 'auto' }}>
      {logsByDays.map((logsByDay, dayLogsIndex) => (
        <LogsBox
          key={logsByDay.id}
          id={logsByDay.id}
          title={
            <Typography variant="h5">
              {formatDate(logsByDay.date, 'dayName day monthName year', translation)}
            </Typography>
          }
          isOpenedAtStart={dayLogsIndex === 0}
        >
          <LogsByGroupsLayout logs={logsByDay.logs} logsByDayId={logsByDay.id} />
        </LogsBox>
      ))}
    </Stack>
  )
}

/** One box per day, only the most recent one opened. */
export const LogsByDaysLayout = memo(LogsByDaysLayoutComponent)
