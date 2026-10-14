import { describe, it, expect } from 'vitest'

import { parseTimezone } from '../parseTimezone.js'

describe('parseTimezone', () => {
  it.each([
    { raw: 'Europe/Paris', timezone: 'Europe/Paris' },
    { raw: ' Europe/Paris ', timezone: 'Europe/Paris' },
    { raw: 'UTC', timezone: 'UTC' },
    { raw: 'GMT', timezone: 'UTC' },
    { raw: 'UTC+0', timezone: 'UTC' },
    { raw: 'UTC+2', timezone: '+02:00' },
    { raw: 'GMT+2', timezone: '+02:00' },
    { raw: 'UTC-11', timezone: '-11:00' },
    { raw: 'UTC+5:30', timezone: '+05:30' }
  ])('Should give $timezone for "$raw"', ({ raw, timezone }) => {
    expect(parseTimezone(raw)).toBe(timezone)
  })

  it.each(['Europe/Paris', 'UTC', 'GMT+2', 'UTC-11', 'UTC+5:30'])(
    'Should give a zone Intl knows too for "%s"',
    (raw) => {
      expect(() => new Intl.DateTimeFormat('en', { timeZone: parseTimezone(raw) })).not.toThrow()
    }
  )

  it.each(['Mars/Olympus', ''])('Should throw if the timezone is not a known one ("%s")', (raw) => {
    expect(() => parseTimezone(raw)).toThrow(`Invalid timezone: ${raw}`)
  })
})
