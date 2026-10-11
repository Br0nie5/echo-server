import { z } from 'zod'

/**
 * Runtime validation of the severity of a log.
 *
 * It is the single source of truth of the severities: the `LogLevel` values and type are derived
 * from it, and so is the schema of the API (see `logs.schemas.ts` in the backend).
 */
export const LogLevelSchema = z.enum(['SUCCESS', 'INFO', 'WARNING', 'ERROR'])

/** The severities a log can have, by name: `LogLevel.INFO`. */
export const LogLevel = LogLevelSchema.enum

/** The severity of a log. */
// The values and their type share a name on purpose, so `LogLevel.INFO` and `LogLevel` read
// like an enum, which `erasableSyntaxOnly` forbids.
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type LogLevel = z.infer<typeof LogLevelSchema>
