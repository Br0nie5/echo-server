import type { Log } from '@echo/utilities'
import { Box, Stack, Typography, useTheme } from '@mui/material'
import { memo, useMemo } from 'react'

import { CollapsibleBox } from '../../../../shared/components/CollapsibleBox'
import { LogCard } from '../components/LogCard'
import { groupLogsByJob } from '../utils/groupLogs'

type LogsByJobsLayoutProps = {
  logs: Log[]
}

const LogsByJobsLayoutComponent: React.FC<LogsByJobsLayoutProps> = ({ logs }) => {
  const theme = useTheme()

  const logsByJobs = useMemo(() => groupLogsByJob(logs), [logs])

  return (
    <Stack spacing={theme.dimensions.logs.jobsGap} sx={{ overflowX: 'auto' }}>
      {logsByJobs.map((logsByJob) => {
        return (
          <Box
            key={logsByJob.id}
            sx={{
              border: `${theme.dimensions.logs.jobBorderWidth} solid ${theme.palette.logJobBorder}`,
              borderRadius: theme.shape.logJobRadius,
              padding: theme.dimensions.logs.jobPadding
            }}
          >
            <CollapsibleBox
              title={
                <Typography variant="logJobTitle" align="center">
                  {`[${logsByJob.locationName}] > [${logsByJob.jobId}]`}
                </Typography>
              }
              isOpenedByParent
            >
              {logsByJob.logs.map((log) => (
                <LogCard key={log.id} log={log} />
              ))}
            </CollapsibleBox>
          </Box>
        )
      })}
    </Stack>
  )
}

/** The logs of a group, one box per job. */
export const LogsByJobsLayout = memo(LogsByJobsLayoutComponent)
