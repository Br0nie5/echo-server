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
    <Stack spacing={2} sx={{ overflowX: 'auto' }}>
      {logsByJobs.map((logsByJob) => {
        return (
          <Box
            key={logsByJob.id}
            sx={{
              border: `1px solid ${theme.palette.secondary.main}`,
              borderRadius: 4,
              padding: 1
            }}
          >
            <CollapsibleBox
              id={logsByJob.id}
              title={
                <Typography variant="body1" align="center" sx={{ fontWeight: 'bold' }}>
                  {`[${logsByJob.locationName}] > [${logsByJob.jobId}]`}
                </Typography>
              }
              isOpenedAtStart
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
