import type { LogLevel } from '@echo/utilities'

/** Rank of the level by severity. */
const getLogLevelSortingValue = (logLevel: LogLevel): number => {
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
export const sortLogLevels = (logLevel1: LogLevel, logLevel2: LogLevel): number => {
  return getLogLevelSortingValue(logLevel1) - getLogLevelSortingValue(logLevel2)
}
