import { describe, it, expect } from 'vitest'

import { requireEnv } from '../requireEnv.js'

describe('requireEnv', () => {
  it('Should return the value of the variable', () => {
    expect(requireEnv({ LOGS_DIR_PATH: '/some/path' }, 'LOGS_DIR_PATH')).toBe('/some/path')
  })

  it('Should leave out the spaces around the value', () => {
    expect(requireEnv({ SERVER_NAME: '  Echo ' }, 'SERVER_NAME')).toBe('Echo')
  })

  it.each([
    { value: 14, text: '14' },
    { value: 0, text: '0' },
    { value: true, text: 'true' },
    { value: false, text: 'false' }
  ])('Should give $value as the text "$text"', ({ value, text }) => {
    expect(requireEnv({ SOME_VARIABLE: value }, 'SOME_VARIABLE')).toBe(text)
  })

  it.each([undefined, null, '', '   ', {}])(
    'Should throw if the variable is missing or blank (%j)',
    (value) => {
      expect(() => requireEnv({ LOGS_DIR_PATH: value }, 'LOGS_DIR_PATH')).toThrow(
        'Missing required environment variable: LOGS_DIR_PATH'
      )
    }
  )
})
