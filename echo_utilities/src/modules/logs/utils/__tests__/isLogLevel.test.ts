import { describe, it, expect } from 'vitest'

import { LogLevel } from '../../schemas/logLevel.schema.js'
import { isLogLevel } from '../isLogLevel.js'

describe('isLogLevel', () => {
  it('Should return true if string is a log level', () => {
    Object.values(LogLevel).forEach((level) => {
      expect(isLogLevel(level)).toBeTruthy()
    })
  })

  it('Should return false if string is not a log level', () => {
    expect(isLogLevel('Not a log level')).toBeFalsy()
  })
})
