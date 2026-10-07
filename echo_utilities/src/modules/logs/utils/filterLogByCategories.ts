import type { Log } from '../schemas/log.schema.js'
import type { LogCategory } from '../schemas/logCategory.schema.js'

/** Whether the log is in one of the categories. No category means no filtering. Shared by the backend and the frontend worker. */
export const filterLogByCategories = (log: Log, categories: LogCategory[]): boolean => {
  if (categories.length === 0) {
    return true
  }

  return categories.includes(log.category)
}
