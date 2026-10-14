import type { Log } from '@echo/utilities'

/** The logs of one day. `date` is that day at noon, local time. */
export interface LogsByDay {
  id: string
  date: Date
  logs: Log[]
}

/** The logs of one group. */
export interface LogsByGroup {
  id: string
  /** Undefined for the logs that do not belong to any group. */
  name: string | undefined
  logs: Log[]
}

/** Consecutive logs of one job, at one location. */
export interface LogsByJob {
  id: string
  locationName: string
  jobId: number
  logs: Log[]
}
