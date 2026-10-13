import { describe, it, expect } from 'vitest'

import { RawJsonLogLineSchema } from '../rawJsonLog.dto.js'

describe('RawJsonLogLineSchema', () => {
  it('Should accept a valid raw JSON log line', () => {
    const rawLine = {
      jobId: 1,
      timestamp: '2024-05-12T14:30:00.386Z',
      level: 'WARNING',
      message: 'Ok',
      origin: '/server/billing/count_stock.sh:4'
    }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeTruthy()
  })

  it('Should accept a raw JSON log line without the optional origin', () => {
    const rawLine = {
      jobId: 1,
      timestamp: '2024-05-12T14:30:00.386Z',
      level: 'WARNING',
      message: 'Ok'
    }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeTruthy()
  })

  it('Should reject a raw JSON log line with an empty origin', () => {
    const rawLine = {
      jobId: 1,
      timestamp: '2024-05-12T14:30:00.386Z',
      level: 'WARNING',
      message: 'Ok',
      origin: ''
    }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeFalsy()
  })

  it('Should reject a raw log line missing a required field', () => {
    const rawLine = { jobId: 1, timestamp: '2024-05-12T14:30:00.386Z', level: 'INFO' }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeFalsy()
  })

  it('Should reject a raw log line with a non-number jobId', () => {
    const rawLine = {
      jobId: '1',
      timestamp: '2024-05-12T14:30:00.386Z',
      level: 'INFO',
      message: 'Ok',
      origin: '/server/billing/count_stock.sh:4'
    }

    expect(RawJsonLogLineSchema.safeParse(rawLine).success).toBeFalsy()
  })

  it('Should reject a non-object value', () => {
    expect(RawJsonLogLineSchema.safeParse('not an object').success).toBeFalsy()
  })
})
