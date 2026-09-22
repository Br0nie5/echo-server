import { z } from 'zod'

/** Validates the content of the self-logs session file. */
export const SelfLogsSessionSchema = z.object({
  lastJobId: z.number().int()
})

/** Content of the self-logs session file: the last `jobId` used, one per server boot. */
export type SelfLogsSession = z.infer<typeof SelfLogsSessionSchema>
