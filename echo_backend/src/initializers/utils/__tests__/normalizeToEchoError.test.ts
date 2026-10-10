import { describe, expect, it } from 'vitest'

import { normalizeToEchoError } from '../normalizeToEchoError.js'

describe('normalizeToEchoError', () => {
  it('Should pass through an already-EchoError-shaped value', () => {
    expect(normalizeToEchoError({ statusCode: 400, message: 'Bad input.' })).toEqual({
      statusCode: 400,
      message: 'Bad input.'
    })
  })

  it('Should pass through a Fastify-style error with a statusCode and message', () => {
    const error = Object.assign(new Error("querystring must have required property 'fromDate'"), {
      statusCode: 400
    })

    expect(normalizeToEchoError(error)).toEqual({
      statusCode: 400,
      message: "querystring must have required property 'fromDate'"
    })
  })

  it('Should default a bare Error to a generic 500', () => {
    expect(normalizeToEchoError(new Error('Cannot read properties of undefined'))).toEqual({
      statusCode: 500,
      message: 'An unexpected error occurred.'
    })
  })

  it('Should default a non-object thrown value to a generic 500', () => {
    expect(normalizeToEchoError('boom')).toEqual({
      statusCode: 500,
      message: 'An unexpected error occurred.'
    })
  })

  it('Should default an object missing a numeric statusCode to a generic 500', () => {
    expect(normalizeToEchoError({ statusCode: '400', message: 'Bad input.' })).toEqual({
      statusCode: 500,
      message: 'An unexpected error occurred.'
    })
  })

  it('Should default an object missing a string message to a generic 500', () => {
    expect(normalizeToEchoError({ statusCode: 400, message: undefined })).toEqual({
      statusCode: 500,
      message: 'An unexpected error occurred.'
    })
  })

  it('Should default null to a generic 500', () => {
    expect(normalizeToEchoError(null)).toEqual({
      statusCode: 500,
      message: 'An unexpected error occurred.'
    })
  })
})
