import { z } from 'zod'

import type { LastCheckDate } from '../../domain/lastCheckDate.js'

/** Validates the JSON of the last-check file. */
export const LastCheckDateDtoSchema = z.object({
  lastCheck: z.string()
})

/** The last check date as it is stored in the last-check file: `lastCheck` is an ISO date. */
export type LastCheckDateDto = z.infer<typeof LastCheckDateDtoSchema>

/**
 * Converts the content of the last-check file to the `LastCheckDate` it holds.
 *
 * Returns `undefined` when the content holds none: it is not JSON, does not have the shape of a
 * `LastCheckDateDto`, or its `lastCheck` is not a date.
 */
export const convertRawLastCheckDateToLastCheckDate = (
  rawLastCheckDate: string
): LastCheckDate | undefined => {
  let json: unknown

  try {
    json = JSON.parse(rawLastCheckDate)
  } catch {
    return
  }

  const lastCheckDateDto = LastCheckDateDtoSchema.safeParse(json)

  if (!lastCheckDateDto.success) {
    return
  }

  const lastCheckDate = new Date(lastCheckDateDto.data.lastCheck)

  if (isNaN(lastCheckDate.getTime())) {
    return
  }

  return { lastCheckDate }
}

/** Converts a `LastCheckDate` to the content the last-check file stores it as. */
export const convertLastCheckDateToRawLastCheckDate = ({
  lastCheckDate
}: LastCheckDate): string => {
  const lastCheckDateDto: LastCheckDateDto = { lastCheck: lastCheckDate.toISOString() }

  return JSON.stringify(lastCheckDateDto, null, 2)
}
