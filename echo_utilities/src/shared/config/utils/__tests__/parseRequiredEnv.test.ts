import { describe, it, expect, vi } from 'vitest'

import { parseRequiredEnv } from '../parseRequiredEnv.js'

describe('parseRequiredEnv', () => {
  it('Should give what the parser makes of the text of the variable', () => {
    const parse = vi.fn((raw: string) => Number(raw))

    expect(parseRequiredEnv({ SOME_VARIABLE: ' 30 ' }, 'SOME_VARIABLE', parse)).toBe(30)
    expect(parse).toHaveBeenCalledExactlyOnceWith('30')
  })

  it('Should throw without parsing if the variable is missing', () => {
    const parse = vi.fn()

    expect(() => parseRequiredEnv({}, 'SOME_VARIABLE', parse)).toThrow(
      new Error('Missing required environment variable: SOME_VARIABLE')
    )
    expect(parse).not.toHaveBeenCalled()
  })

  it('Should name the variable in the error of the parser', () => {
    expect(() =>
      parseRequiredEnv({ SOME_VARIABLE: 'thirty' }, 'SOME_VARIABLE', (raw) => {
        throw new Error(`Invalid number of days: ${raw}`)
      })
    ).toThrow(new Error('SOME_VARIABLE: Invalid number of days: thirty'))
  })
})
