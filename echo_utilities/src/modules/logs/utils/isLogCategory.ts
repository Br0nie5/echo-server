import { LogCategorySchema, type LogCategory } from '../schemas/logCategory.schema.js'

/** Tells whether `rawLogCategory` is one of the severities a log can have. */
export const isLogCategory = (rawLogCategory: string): rawLogCategory is LogCategory =>
  LogCategorySchema.safeParse(rawLogCategory).success
