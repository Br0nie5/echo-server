import type { Log } from '@echo/utilities'
import { Stack, Typography } from '@mui/material'
import { memo } from 'react'

import { CollapsibleBox } from '../../../../shared/components/CollapsibleBox'
import { useWindowSize } from '../../../../shared/hooks/useWindowSize'
import { useAppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { useLogsByGroupsLayout } from '../hooks/useLogsByGroupsLayout'

import { LogsByJobsLayout } from './LogsByJobsLayout'

type LogsByGroupsLayoutProps = {
  logs: Log[]
  logsByDayId: string
}

const LogsByGroupsLayoutComponent: React.FC<LogsByGroupsLayoutProps> = ({ logs, logsByDayId }) => {
  const translation = useAppTranslation()
  const { windowSize, isSmallScreen } = useWindowSize()
  const { logsByGroups } = useLogsByGroupsLayout(logs, logsByDayId)

  return (
    <Stack direction={isSmallScreen ? 'column' : 'row'} sx={{ overflowX: 'auto' }} spacing={1}>
      {logsByGroups.map((logsByGroup) => {
        return (
          <CollapsibleBox
            key={logsByGroup.id}
            id={logsByGroup.id}
            title={
              <Typography variant="h6">
                {logsByGroup.name ?? translation('logs.noGroupLabel')}
              </Typography>
            }
            isOpenedAtStart
            width={isSmallScreen ? undefined : `${windowSize.width / 2.5}px`}
          >
            <LogsByJobsLayout logs={logsByGroup.logs} />
          </CollapsibleBox>
        )
      })}
    </Stack>
  )
}

/** The logs of a day, one box per group: side by side, or stacked on a small screen. */
export const LogsByGroupsLayout = memo(LogsByGroupsLayoutComponent)
