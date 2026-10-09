import type { Log } from '@echo/utilities'
import { Stack, Typography } from '@mui/material'
import { memo, useMemo } from 'react'

import { CollapsibleBox } from '../../../../shared/components/CollapsibleBox'
import { useAppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { formatDate } from '../../../../shared/utils/formatDate'
import { groupLogsByDay } from '../utils/groupLogs'

import { LogsByGroupsLayout } from './LogsByGroupsLayout'

type LogsByDaysLayoutProps = {
  filteredLogs: Log[]
}

const LogsByDaysLayoutComponent: React.FC<LogsByDaysLayoutProps> = ({ filteredLogs }) => {
  const translation = useAppTranslation()
  const logsByDays = useMemo(() => groupLogsByDay(filteredLogs), [filteredLogs])

  return (
    <Stack spacing={2} sx={{ overflowX: 'auto' }}>
      {logsByDays.map((logsByDay, dayLogsIndex) => (
        <CollapsibleBox
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
        </CollapsibleBox>
      ))}
    </Stack>
  )
}

/** One box per day, only the most recent one opened. */
export const LogsByDaysLayout = memo(LogsByDaysLayoutComponent)
