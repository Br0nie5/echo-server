import { LogLevelSchema, type LogLevel } from '../schemas/logLevel.schema.js'

/** Tells whether `rawLogLevel` is one of the severities a log can have. */
export const isLogLevel = (rawLogLevel: string): rawLogLevel is LogLevel =>
  LogLevelSchema.safeParse(rawLogLevel).success
