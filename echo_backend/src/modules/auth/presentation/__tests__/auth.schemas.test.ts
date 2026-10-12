import type { ValidateFunction } from 'ajv'
import { Ajv } from 'ajv'
import { describe, it, expect, beforeAll } from 'vitest'

import {
  AuthStatusJsonSchema,
  LoginRequestJsonSchema,
  SignUpRequestJsonSchema
} from '../auth.schemas.js'

describe('AuthStatusJsonSchema', () => {
  let validateAuthStatus: ValidateFunction

  beforeAll(() => {
    validateAuthStatus = new Ajv().compile(AuthStatusJsonSchema)
  })

  it('Should be named AuthStatus', () => {
    expect(AuthStatusJsonSchema.$id).toBe('AuthStatus')
  })

  it.each(['authenticated', 'unauthenticated', 'needsSignUp'])(
    'Should accept the status %s',
    (status) => {
      expect(validateAuthStatus({ status })).toBe(true)
    }
  )

  it('Should reject an auth status without status', () => {
    expect(validateAuthStatus({})).toBe(false)
    expect(validateAuthStatus.errors?.[0].message).toContain('required')
  })

  it('Should reject a status it does not know', () => {
    expect(validateAuthStatus({ status: 'loggedOut' })).toBe(false)
    expect(validateAuthStatus.errors?.[0].message).toContain('allowed values')
  })

  it('Should reject an auth status with additional properties', () => {
    expect(validateAuthStatus({ status: 'authenticated', extra: 'not allowed' })).toBe(false)
    expect(validateAuthStatus.errors?.[0].message).toContain('must NOT have additional properties')
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

  it(`Should be named ${name}`, () => {
    expect(schema.$id).toBe(name)
  })

  it('Should accept a username and a password, and leave unknown properties alone', () => {
    expect(validateRequest({ username: 'admin', password: 'secret' })).toBe(true)
    expect(validateRequest({ username: 'admin', password: 'secret', unknown: 'value' })).toBe(true)
  })

  it('Should reject a request without username or without password', () => {
    expect(validateRequest({ password: 'secret' })).toBe(false)
    expect(validateRequest.errors?.[0].message).toContain('required')
    expect(validateRequest({ username: 'admin' })).toBe(false)
    expect(validateRequest.errors?.[0].message).toContain('required')
  })

  it('Should reject a password that is not a string', () => {
    expect(validateRequest({ username: 'admin', password: 1234 })).toBe(false)
    expect(validateRequest.errors?.[0].message).toContain('string')
  })
})
