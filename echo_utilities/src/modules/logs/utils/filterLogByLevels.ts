import type { Log } from '../schemas/log.schema.js'
import type { LogLevel } from '../schemas/logLevel.schema.js'

/**
 * Tells whether `log` has one of `levels`.
 *
 * Without any level, every log is kept.
 *
 * ```ts
 * const problemLevels = [LogLevel.WARNING, LogLevel.ERROR]
 * const problemLogs = logs.filter((log) => filterLogByLevels(log, problemLevels))
 * ```
 */
export const filterLogByLevels = (log: Log, levels: LogLevel[]): boolean => {
  if (levels.length === 0) {
    return true
  }

  return levels.includes(log.level)
}
