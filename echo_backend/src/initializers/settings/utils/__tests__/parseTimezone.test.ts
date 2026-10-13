import { describe, it, expect } from 'vitest'

import { parseTimezone } from '../parseTimezone.js'

describe('parseTimezone', () => {
  it('Should use the given IANA zone', () => {
    expect(parseTimezone('Europe/Paris')).toBe('Europe/Paris')
  })

  it('Should use the given UTC offset', () => {
    expect(parseTimezone('UTC+2')).toBe('UTC+2')
  })

  it('Should read a GMT offset as the matching UTC offset', () => {
    expect(parseTimezone('GMT+2')).toBe('UTC+2')
  })

  it('Should ignore the spaces around the timezone', () => {
    expect(parseTimezone(' Europe/Paris ')).toBe('Europe/Paris')
  })

  it.each(['Mars/Olympus', ''])('Should throw if the timezone is not a known one ("%s")', (raw) => {
    expect(() => parseTimezone(raw)).toThrow(`Invalid timezone: ${raw}`)
  })
})
