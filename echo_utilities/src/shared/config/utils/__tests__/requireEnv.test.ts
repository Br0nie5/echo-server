import { describe, it, expect } from 'vitest'

import { requireEnv } from '../requireEnv.js'

describe('requireEnv', () => {
  it('Should give the text of the variable', () => {
    expect(requireEnv({ SOME_VARIABLE: 'some value' }, 'SOME_VARIABLE')).toBe('some value')
  })

  it('Should read the variable it is asked for among the others', () => {
    const env = { SOME_VARIABLE: 'some value', ANOTHER_VARIABLE: 'another value' }

    expect(requireEnv(env, 'ANOTHER_VARIABLE')).toBe('another value')
  })

  it('Should leave out the spaces around the text, and keep those inside it', () => {
    expect(requireEnv({ SOME_VARIABLE: '  some value ' }, 'SOME_VARIABLE')).toBe('some value')
  })

  it.each([
    { value: 14, text: '14' },
    { value: 0, text: '0' },
    { value: true, text: 'true' },
    { value: false, text: 'false' }
  ])('Should give $value as the text "$text"', ({ value, text }) => {
    expect(requireEnv({ SOME_VARIABLE: value }, 'SOME_VARIABLE')).toBe(text)
  })

  it.each([undefined, null, '', '   ', {}, ['some value']])(
    'Should throw when the variable is %j, which is no text to read',
    (value) => {
      expect(() => requireEnv({ SOME_VARIABLE: value }, 'SOME_VARIABLE')).toThrow(
        new Error('Missing required environment variable: SOME_VARIABLE')
      )
    }
  )

  it('Should throw when the variable is not in the env', () => {
    expect(() => requireEnv({ ANOTHER_VARIABLE: 'another value' }, 'SOME_VARIABLE')).toThrow(
      new Error('Missing required environment variable: SOME_VARIABLE')
    )
  })
})
