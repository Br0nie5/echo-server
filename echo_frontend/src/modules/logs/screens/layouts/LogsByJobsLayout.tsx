import type { Log } from '@echo/utilities'
import { Box, Stack, Typography, useTheme } from '@mui/material'
import { memo } from 'react'

import { LogCard } from '../components/LogCard'
import { LogsBox } from '../components/LogsBox'
import { useLogsByJobsLayout } from '../hooks/useLogsByJobsLayout'

type LogsByJobsLayoutProps = {
  logs: Log[]
}

const LogsByJobsLayoutComponent: React.FC<LogsByJobsLayoutProps> = ({ logs }) => {
  const theme = useTheme()

  const { logsByJobs } = useLogsByJobsLayout(logs)

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
            <LogsBox
              id={logsByJob.id}
              title={
                <Typography variant="body1" align="center" sx={{ fontWeight: 'bold' }}>
                  {`[${logsByJob.fileName}] > [${logsByJob.jobId}]`}
                </Typography>
              }
              isOpenedAtStart
            >
              {logsByJob.logs.map((log) => (
                <LogCard key={log.id} log={log} />
              ))}
            </LogsBox>
          </Box>
        )
      })}
    </Stack>
  )
}

/** The logs of a group, one box per job. */
export const LogsByJobsLayout = memo(LogsByJobsLayoutComponent)
