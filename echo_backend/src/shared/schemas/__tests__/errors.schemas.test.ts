import { Ajv, type ValidateFunction } from 'ajv'
import { describe, it, expect, beforeAll } from 'vitest'

import { EchoErrorJsonSchema } from '../errors.schemas.js'

describe('EchoErrorJsonSchema', () => {
  let validate: ValidateFunction

  beforeAll(() => {
    const ajv = new Ajv()
    validate = ajv.compile(EchoErrorJsonSchema)
  })

  it('Should be a valid error object', () => {
    const data = { statusCode: 500, message: 'Something went wrong' }
    const isValid = validate(data)

    expect(isValid).toBe(true)
  })

  it('Should reject when statusCode is missing', () => {
    const data = { message: 'oops' }
    const isValid = validate(data)

    expect(isValid).toBe(false)
    expect(validate.errors?.[0].message).toContain('required')
  })

  it('Should reject when message is not a string', () => {
    const data = { statusCode: 400, message: 123 }
    const isValid = validate(data)

    expect(isValid).toBe(false)
    expect(validate.errors?.[0].message).toContain('string')
  })

  it('Should reject when statusCode is not an integer', () => {
    const data = { statusCode: '400', message: 'bad request' }
    const isValid = validate(data)

    expect(isValid).toBe(false)
    expect(validate.errors?.[0].message).toContain('integer')
  })
})
