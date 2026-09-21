import type { Log } from '@echo/utilities'

import { sortGroupsByNewestFirstLog } from './groupLogs'
import type { LogsByJob } from './types'

/** A job is a run of consecutive logs of the same job id in the same file. */
export const groupLogsByJob = (logs: Log[]): LogsByJob[] => {
  const logsByJobs: LogsByJob[] = []

  logs.forEach((log, logIndex) => {
    const previousLogsByJob = logsByJobs.at(-1)

    if (
      previousLogsByJob !== undefined &&
      previousLogsByJob.jobId === log.jobId &&
      previousLogsByJob.fileName === log.fileName
    ) {
      previousLogsByJob.logs.push(log)
      return
    }

    logsByJobs.push({
      id: `${logIndex} - ${log.fileName} - ${log.jobId}`,
      fileName: log.fileName,
      jobId: log.jobId,
      logs: [log]
    })
  })

  return sortGroupsByNewestFirstLog(logsByJobs)
}
