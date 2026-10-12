import { describe, it, expect } from 'vitest'

import type { EchoError } from '../echoError.schema.js'
import { EchoErrorSchema } from '../echoError.schema.js'

const echoError: EchoError = { statusCode: 400, message: 'Bad input.' }

describe('EchoErrorSchema', () => {
  it('Should accept a status code and a message', () => {
    expect(EchoErrorSchema.parse(echoError)).toEqual(echoError)
  })

  it('Should leave out the properties it does not describe', () => {
    expect(EchoErrorSchema.parse({ ...echoError, details: 'Some details.' })).toEqual(echoError)
  })

  it.each([
    { reason: 'without status code', error: { message: 'Bad input.' } },
    { reason: 'without message', error: { statusCode: 400 } },
    {
      reason: 'with a status code that is not an integer',
      error: { ...echoError, statusCode: 400.5 }
    },
    {
      reason: 'with a status code written as a text',
      error: { ...echoError, statusCode: '400' }
    },
    { reason: 'with a message that is not a text', error: { ...echoError, message: 400 } },
    { reason: 'that is not an object', error: 'Bad input.' }
  ])('Should refuse an error $reason', ({ error }) => {
    expect(EchoErrorSchema.safeParse(error).success).toBe(false)
  })
})
