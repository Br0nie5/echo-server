import type { Log } from '../schemas/log.schema.js'
import type { LogLevel } from '../schemas/logLevel.schema.js'

/**
 * Tells whether `log` has one of `levels`.
 *
 * Without any level, every log is kept.
 *
 * ```ts
 * const watchedLevels = [LogLevel.WARNING, LogLevel.ERROR]
 * const watchedLogs = logs.filter((log) => filterLogByLevels(log, watchedLevels))
 * ```
 */
export const filterLogByLevels = (log: Log, levels: LogLevel[]): boolean => {
  if (levels.length === 0) {
    return true
  }

  return levels.includes(log.level)
}
