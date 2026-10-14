import type { LogLevel } from '@echo/utilities'

/** The severity of the level, higher for a more severe one. */
const getLogLevelSeverity = (logLevel: LogLevel): number => {
  switch (logLevel) {
    case 'SUCCESS':
      return 1
    case 'INFO':
      return 2
    case 'WARNING':
      return 3
    case 'ERROR':
      return 4
  }
}

/** Comparator ordering levels from the least to the most severe. */
export const compareLogLevels = (logLevel1: LogLevel, logLevel2: LogLevel): number => {
  return getLogLevelSeverity(logLevel1) - getLogLevelSeverity(logLevel2)
}
