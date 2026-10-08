import { z } from 'zod'

/** Validates the JSON of the session file. */
export const SessionJobIdDtoSchema = z.object({
  lastJobId: z.int()
})

/** The last session job id as it is stored in the session file. */
export type SessionJobIdDto = z.infer<typeof SessionJobIdDtoSchema>
