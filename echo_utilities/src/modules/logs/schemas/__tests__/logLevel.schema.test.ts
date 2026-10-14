import { describe, it, expect } from 'vitest'

import { LogLevel, LogLevelSchema } from '../logLevel.schema.js'

describe('LogLevelSchema', () => {
  it.each(['SUCCESS', 'INFO', 'WARNING', 'ERROR'])('Should accept %s', (level) => {
    expect(LogLevelSchema.parse(level)).toBe(level)
  })

  it.each(['DEBUG', 'info', '', 3, null])('Should refuse %j', (notALevel) => {
    expect(LogLevelSchema.safeParse(notALevel).success).toBe(false)
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
