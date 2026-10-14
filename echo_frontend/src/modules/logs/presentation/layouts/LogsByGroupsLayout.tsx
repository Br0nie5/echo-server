import type { Log } from '@echo/utilities'
import { Stack, Typography, useTheme } from '@mui/material'
import { memo, useMemo } from 'react'

import { CollapsibleBox } from '../../../../shared/components/CollapsibleBox'
import { useWindowSize } from '../../../../shared/hooks/useWindowSize'
import { useAppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { groupLogsByGroup } from '../utils/groupLogs'

import { LogsByJobsLayout } from './LogsByJobsLayout'

type LogsByGroupsLayoutProps = {
  logs: Log[]
}

const LogsByGroupsLayoutComponent: React.FC<LogsByGroupsLayoutProps> = ({ logs }) => {
  const translation = useAppTranslation()
  const theme = useTheme()
  const { windowSize, isPortrait } = useWindowSize()
  const logsByGroups = useMemo(() => groupLogsByGroup(logs), [logs])

  return (
    <Stack
      direction={isPortrait ? 'column' : 'row'}
      sx={{ overflowX: 'auto' }}
      spacing={theme.dimensions.logs.groupsGap}
    >
      {logsByGroups.map((logsByGroup) => {
        return (
          <CollapsibleBox
            key={logsByGroup.id}
            title={
              <Typography variant="h6">
                {logsByGroup.name ?? translation('logs.noGroupLabel')}
              </Typography>
            }
            isOpenedByParent
            width={
              isPortrait
                ? undefined
                : `${windowSize.width * theme.dimensions.logs.groupWidthShareOfWindow}px`
            }
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
