import { z } from 'zod'

import { convertToDateFromISO } from '../../../../../../shared/utils/convertToDateFromISO.js'

/** Validates the JSON of the last-check file. */
const LastCheckDateDtoSchema = z.object({
  lastCheck: z.string()
})

/** The last check date as it is stored in the last-check file: `lastCheck` is an ISO date. */
type LastCheckDateDto = z.infer<typeof LastCheckDateDtoSchema>

/**
 * Converts the content of the last-check file to the date of the last check it holds.
 *
 * Returns `undefined` when the content holds none: it is not JSON, does not have the shape of a
 * `LastCheckDateDto`, or its `lastCheck` is not an ISO date.
 */
export const convertRawLastCheckDateToLastCheckDate = (
  rawLastCheckDate: string
): Date | undefined => {
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

  return convertToDateFromISO(lastCheckDateDto.data.lastCheck)
}

/** Converts the date of the last check to the content the last-check file stores it as. */
export const convertLastCheckDateToRawLastCheckDate = (lastCheckDate: Date): string => {
  const lastCheckDateDto: LastCheckDateDto = { lastCheck: lastCheckDate.toISOString() }

  return JSON.stringify(lastCheckDateDto, null, 2)
}
