import type { Log } from '../schemas/log.schema.js'
import type { LogLevel } from '../schemas/logLevel.schema.js'

/** Whether the log is in one of the levels. No level means no filtering. Shared by the backend and the frontend worker. */
export const filterLogByLevels = (log: Log, levels: LogLevel[]): boolean => {
  if (levels.length === 0) {
    return true
  }

  return levels.includes(log.level)
}
