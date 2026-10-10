import { describe, it, expect } from 'vitest'

import type { EchoError } from '../echoError.schema.js'
import { EchoErrorSchema } from '../echoError.schema.js'

const validEchoError: EchoError = { statusCode: 400, message: 'Bad input.' }

describe('EchoErrorSchema', () => {
  it('Should accept a status code and a message', () => {
    expect(EchoErrorSchema.safeParse(validEchoError).success).toBeTruthy()
  })

  it('Should leave out the properties it does not describe', () => {
    expect(EchoErrorSchema.parse({ ...validEchoError, code: 'FST_ERR_VALIDATION' })).toEqual(
      validEchoError
    )
  })

  it('Should reject an EchoError missing the message', () => {
    expect(EchoErrorSchema.safeParse({ statusCode: 400 }).success).toBeFalsy()
  })

  it('Should reject an EchoError with a non-integer statusCode', () => {
    expect(EchoErrorSchema.safeParse({ ...validEchoError, statusCode: 400.5 }).success).toBeFalsy()
    expect(EchoErrorSchema.safeParse({ ...validEchoError, statusCode: '400' }).success).toBeFalsy()
  })
})
