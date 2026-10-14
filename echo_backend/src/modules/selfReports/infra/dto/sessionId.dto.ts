import { z } from 'zod'

/** Validates the JSON of the session file. */
export const SessionIdDtoSchema = z.object({
  lastSessionId: z.int()
})

/** The last session id as it is stored in the session file. */
export type SessionIdDto = z.infer<typeof SessionIdDtoSchema>
