import type { Log } from '@echo/utilities'
import { useMemo } from 'react'

import { groupLogsByJob } from '../utils/groupLogsByJob'
import type { LogsByJob } from '../utils/types'

/** The logs grouped by job, newest first. */
export const useLogsByJobsLayout = (logs: Log[]): { logsByJobs: LogsByJob[] } => {
  const logsByJobs = useMemo(() => groupLogsByJob(logs), [logs])

  return { logsByJobs }
}
