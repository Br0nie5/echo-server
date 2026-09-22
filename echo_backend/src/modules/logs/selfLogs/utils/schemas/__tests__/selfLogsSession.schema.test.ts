import { describe, it, expect } from 'vitest'

import { SelfLogsSessionSchema } from '../selfLogsSession.schema.js'

describe('SelfLogsSessionSchema', () => {
  it('should accept a valid self-logs session payload', () => {
    expect(SelfLogsSessionSchema.safeParse({ lastJobId: 1 }).success).toBeTruthy()
  })

  it('should reject a payload missing lastJobId', () => {
    expect(SelfLogsSessionSchema.safeParse({}).success).toBeFalsy()
  })

  it('should reject a payload with a non-integer lastJobId', () => {
    expect(SelfLogsSessionSchema.safeParse({ lastJobId: 1.5 }).success).toBeFalsy()
  })

  it('should reject a payload with a non-number lastJobId', () => {
    expect(SelfLogsSessionSchema.safeParse({ lastJobId: '1' }).success).toBeFalsy()
  })
})
