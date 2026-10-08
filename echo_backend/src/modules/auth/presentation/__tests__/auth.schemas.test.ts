import type { ValidateFunction } from 'ajv'
import { Ajv } from 'ajv'
import { describe, it, expect, beforeAll } from 'vitest'

import {
  AuthTokenJsonSchema,
  LoginRequestJsonSchema,
  SignUpRequestJsonSchema
} from '../auth.schemas.js'

describe('AuthTokenJsonSchema', () => {
  let validateAuthToken: ValidateFunction

  beforeAll(() => {
    validateAuthToken = new Ajv().compile(AuthTokenJsonSchema)
  })

  it('should be named AuthToken', () => {
    expect(AuthTokenJsonSchema.$id).toBe('AuthToken')
  })

  it('should accept an auth token with or without a message', () => {
    expect(validateAuthToken({ success: true, message: 'Login successful.' })).toBe(true)
    expect(validateAuthToken({ success: false })).toBe(true)
  })

  it('should reject an auth token without success', () => {
    expect(validateAuthToken({ message: 'Login successful.' })).toBe(false)
    expect(validateAuthToken.errors?.[0].message).toContain('required')
  })

  it('should reject an auth token whose success is not a boolean', () => {
    expect(validateAuthToken({ success: 'true' })).toBe(false)
    expect(validateAuthToken.errors?.[0].message).toContain('boolean')
  })

  it('should reject an auth token with additional properties', () => {
    expect(validateAuthToken({ success: true, extra: 'not allowed' })).toBe(false)
    expect(validateAuthToken.errors?.[0].message).toContain('must NOT have additional properties')
  })
})

describe.each([
  { name: 'LoginRequest', schema: LoginRequestJsonSchema },
  { name: 'SignUpRequest', schema: SignUpRequestJsonSchema }
])('$nameJsonSchema', ({ name, schema }) => {
  let validateRequest: ValidateFunction

  beforeAll(() => {
    validateRequest = new Ajv().compile(schema)
  })

  it(`should be named ${name}`, () => {
    expect(schema.$id).toBe(name)
  })

  it('should accept a username and a password, and leave unknown properties alone', () => {
    expect(validateRequest({ username: 'admin', password: 'secret' })).toBe(true)
    expect(validateRequest({ username: 'admin', password: 'secret', unknown: 'value' })).toBe(true)
  })

  it('should reject a request without username or without password', () => {
    expect(validateRequest({ password: 'secret' })).toBe(false)
    expect(validateRequest.errors?.[0].message).toContain('required')
    expect(validateRequest({ username: 'admin' })).toBe(false)
    expect(validateRequest.errors?.[0].message).toContain('required')
  })

  it('should reject a password that is not a string', () => {
    expect(validateRequest({ username: 'admin', password: 1234 })).toBe(false)
    expect(validateRequest.errors?.[0].message).toContain('string')
  })
})
