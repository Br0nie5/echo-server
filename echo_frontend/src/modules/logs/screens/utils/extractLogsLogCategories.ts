import type { LogCategory } from '@echo/utilities'
import { type Log } from '@echo/utilities'

import { sortLogCategories } from './sortLogCategories'

/** The distinct categories present in the logs, sorted by severity. */
export function extractLogsLogCategories(logs: Log[]): LogCategory[] {
  return Array.from(new Set(logs.map((log) => log.category))).sort(sortLogCategories)
}
