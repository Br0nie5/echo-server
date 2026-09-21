import { describe, it, expect } from 'vitest'

import { RawJsonLogLineSchema } from '../rawJsonLogLine.schema.js'

describe('RawJsonLogLineSchema', () => {
  it('should accept a valid raw JSON log line', () => {
    const rawLine = {
      job_id: 1,
      timestamp: '2024-05-12 14:30:00.386',
      status: 'INFO',
      message: 'Ok'
    }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeTruthy()
  })

  it('should reject a raw log line missing a required field', () => {
    const rawLine = { job_id: 1, timestamp: '2024-05-12 14:30:00.386', status: 'INFO' }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeFalsy()
  })

  it('should reject a raw log line with a non-number job_id', () => {
    const rawLine = {
      job_id: '1',
      timestamp: '2024-05-12 14:30:00.386',
      status: 'INFO',
      message: 'Ok'
    }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeFalsy()
  })

  it('should reject a non-object value', () => {
    expect(RawJsonLogLineSchema.safeParse('not an object').success).toBeFalsy()
  })
})
