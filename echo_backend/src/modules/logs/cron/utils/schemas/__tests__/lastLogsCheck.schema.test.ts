import { describe, it, expect } from 'vitest'

import { LastLogsCheckSchema } from '../lastLogsCheck.schema.js'

describe('LastLogsCheckSchema', () => {
  it('should accept a valid last-check payload', () => {
    expect(
      LastLogsCheckSchema.safeParse({ lastCheck: '2026-01-01T00:00:00.000Z' }).success
    ).toBeTruthy()
  })

  it('should reject a payload missing lastCheck', () => {
    expect(LastLogsCheckSchema.safeParse({}).success).toBeFalsy()
  })

  it('should reject a payload with a non-string lastCheck', () => {
    expect(LastLogsCheckSchema.safeParse({ lastCheck: 123 }).success).toBeFalsy()
  })
})
