import { describe, it, expect } from 'vitest'

import { LogLevel } from '../../schemas/logLevel.schema.js'
import { isLogLevel } from '../isLogLevel.js'

describe('isLogLevel', () => {
  it.each(Object.values(LogLevel))('Should tell that %s is a log level', (level) => {
    expect(isLogLevel(level)).toBe(true)
  })

  it.each(['DEBUG', 'info', ' INFO', ''])('Should tell that "%s" is not a log level', (text) => {
    expect(isLogLevel(text)).toBe(false)
  })
})
