import type { Log } from '@echo/utilities'

/** Logs of one day. `date` is that day at noon local time. */
export interface LogsByDay {
  id: string
  date: Date
  logs: Log[]
}

/** Logs of one group (directory). */
export interface LogsByGroup {
  id: string
  /** Undefined for the logs that do not belong to any group. */
  name: string | undefined
  logs: Log[]
}

/** Consecutive logs of one job, in one file. */
export interface LogsByJob {
  id: string
  fileName: string
  jobId: number
  logs: Log[]
}
