import { DateTime, Info } from 'luxon'

/**
 * Parses `raw` into a time zone both Luxon and `Intl` know, so it can be given to whatever shows a
 * date and to whatever runs on a schedule.
 *
 * `raw` is an IANA zone (`Europe/Paris`), which is given back as it is, `UTC`, or a fixed offset
 * (`UTC+2`, `UTC+5:30`, or the same with `GMT`), which is given back as `+02:00` or `+05:30`. The
 * spaces around it are left out. Throws on an unknown zone.
 *
 * ```ts
 * parseTimezone('Europe/Paris') // 'Europe/Paris'
 * parseTimezone('GMT+2') // '+02:00'
 * ```
 */
export const parseTimezone = (raw: string): string => {
  // Luxon only knows fixed offsets as `UTC±h`, so `GMT±h` is read as its alias.
  const zone = Info.normalizeZone(raw.trim().replace(/^GMT/i, 'UTC'))

  if (!zone.isValid) {
    throw new Error(`Invalid timezone: ${raw}`)
  }

  const isFixedOffset = zone.isUniversal && zone.offset(0) !== 0

  // `Intl` knows no `UTC±h` zone, only the offset itself.
  return isFixedOffset ? DateTime.fromMillis(0, { zone }).toFormat('ZZ') : zone.name
}
