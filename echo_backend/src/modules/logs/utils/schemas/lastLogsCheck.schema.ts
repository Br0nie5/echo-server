import { z } from 'zod'

/** Validates the content of the last-check file. */
export const LastLogsCheckSchema = z.object({
  lastCheck: z.string()
})

/** Content of the last-check file: `lastCheck` is an ISO date. */
export type LastLogsCheck = z.infer<typeof LastLogsCheckSchema>
