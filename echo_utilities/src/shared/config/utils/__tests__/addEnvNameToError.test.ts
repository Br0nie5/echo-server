import { describe, it, expect } from 'vitest'

import { addEnvNameToError } from '../addEnvNameToError.js'

describe('addEnvNameToError', () => {
  it('Should return the parsed value when nothing is thrown', () => {
    expect(addEnvNameToError('SOME_VARIABLE', () => 30)).toBe(30)
  })

  it('Should name the variable in the message of the thrown error', () => {
    expect(() =>
      addEnvNameToError('SOME_VARIABLE', () => {
        throw new Error('Invalid number of days')
      })
    ).toThrow(new Error('SOME_VARIABLE: Invalid number of days'))
  })

  it('Should keep the error of the parser as the cause', () => {
    const parserError = new Error('Invalid number of days')

    expect(() =>
      addEnvNameToError('SOME_VARIABLE', () => {
        throw parserError
      })
    ).toThrow(expect.objectContaining({ cause: parserError }))
  })

  it('Should name the variable when what is thrown is not an error', () => {
    expect(() =>
      addEnvNameToError('SOME_VARIABLE', () => {
        throw 'not a number'
      })
    ).toThrow(new Error('SOME_VARIABLE: not a number'))
  })
})
