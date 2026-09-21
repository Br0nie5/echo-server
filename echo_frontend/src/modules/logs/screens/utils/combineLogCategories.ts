import type { LogCategory } from '@echo/utilities'

import { sortLogCategories } from './sortLogCategories'

/** Union of both lists without duplicates, sorted by severity. */
export const combineLogCategories = (
  logCategories1: LogCategory[],
  logCategories2: LogCategory[]
): LogCategory[] => {
  return Array.from(new Set([...logCategories1, ...logCategories2])).sort(sortLogCategories)
}
