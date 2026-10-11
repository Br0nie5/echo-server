import { describe, it, expect } from 'vitest'

import { LogLevel, LogLevelSchema } from '../logLevel.schema.js'

describe('LogLevelSchema', () => {
  it('Should accept every LogLevel value', () => {
    Object.values(LogLevel).forEach((level) => {
      expect(LogLevelSchema.safeParse(level).success).toBeTruthy()
    })
  })

  it('Should reject a string that is not a LogLevel', () => {
    expect(LogLevelSchema.safeParse('NOT_A_LEVEL').success).toBeFalsy()
  })
})

describe('LogLevel', () => {
  it('Should give every severity by its name', () => {
    expect(LogLevel).toEqual({
      SUCCESS: 'SUCCESS',
      INFO: 'INFO',
      WARNING: 'WARNING',
      ERROR: 'ERROR'
    })
  })
})
