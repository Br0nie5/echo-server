import { Info } from 'luxon'

/**
 * Parses `raw` into a Luxon zone.
 *
 * `raw` is a fixed offset (`UTC+2`, or `GMT+2`, which gives `UTC+2`) or an IANA zone
 * (`Europe/Paris`). It is `UTC` when `raw` is missing or empty. Throws on an unknown zone.
 */
export const parseTimezone = (raw: string | undefined): string => {
  if (raw === undefined || raw === '') {
    return 'UTC'
  }
  // Luxon only knows fixed offsets as `UTC±h`, so `GMT±h` is read as its alias.
  const timezone = raw.trim().replace(/^GMT/i, 'UTC')
  if (!Info.normalizeZone(timezone)?.isValid) {
    throw new Error(`Invalid timezone: ${raw}`)
  }
  return timezone
}
