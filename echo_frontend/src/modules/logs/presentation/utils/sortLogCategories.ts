import type { LogCategory } from '@echo/utilities'

/** Rank of the category by severity. */
const getLogCategorySortingValue = (logCategory: LogCategory): number => {
  switch (logCategory) {
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

/** Comparator ordering categories from the least to the most severe. */
export const sortLogCategories = (logCategory1: LogCategory, logCategory2: LogCategory): number => {
  return getLogCategorySortingValue(logCategory1) - getLogCategorySortingValue(logCategory2)
}
