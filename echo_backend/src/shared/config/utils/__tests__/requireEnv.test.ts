import { describe, it, expect } from 'vitest'

import { requireEnv } from '../requireEnv.js'

describe('requireEnv', () => {
  it('should return the value of the variable', () => {
    expect(requireEnv({ LOGS_DIR_PATH: '/some/path' }, 'LOGS_DIR_PATH')).toBe('/some/path')
  })

  it('should throw if the variable is missing', () => {
    expect(() => requireEnv({}, 'LOGS_DIR_PATH')).toThrow(
      'Missing required environment variable: LOGS_DIR_PATH'
    )
  })

  it('should throw if the variable is empty', () => {
    expect(() => requireEnv({ LOGS_DIR_PATH: '' }, 'LOGS_DIR_PATH')).toThrow(
      'Missing required environment variable: LOGS_DIR_PATH'
    )
  })
})
