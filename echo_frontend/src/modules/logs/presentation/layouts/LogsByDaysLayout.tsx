import type { Log } from '@echo/utilities'
import { Stack, Typography } from '@mui/material'
import { memo, useMemo } from 'react'

import { CollapsibleBox } from '../../../../shared/components/CollapsibleBox'
import { useAppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { formatDay } from '../../../../shared/utils/formatDates'
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
          title={<Typography variant="h5">{formatDay(logsByDay.date, translation)}</Typography>}
          isOpenedByParent={dayLogsIndex === 0}
        >
          <LogsByGroupsLayout logs={logsByDay.logs} />
        </CollapsibleBox>
      ))}
    </Stack>
  )
}

/** The logs, one box per day, only the most recent one open. */
export const LogsByDaysLayout = memo(LogsByDaysLayoutComponent)
