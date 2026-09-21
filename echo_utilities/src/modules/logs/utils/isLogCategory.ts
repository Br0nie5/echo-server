import {
  LogCategory as LogCategoryConst,
  type LogCategory
} from '../types/__generated__/logCategory.js'

/** Type guard telling whether a raw string is a known `LogCategory`. */
export const isLogCategory = (rawLogCategory: string): rawLogCategory is LogCategory => {
  return Object.values(LogCategoryConst).includes(rawLogCategory as LogCategory)
}
