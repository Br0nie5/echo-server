import { describe, it, expect } from 'vitest'

import type { LoginRequest } from '../loginRequest.schema.js'
import { LoginRequestSchema } from '../loginRequest.schema.js'

const validLoginRequest: LoginRequest = { username: 'admin', password: 'secret' }

describe('LoginRequestSchema', () => {
  it('Should accept a username and a password', () => {
    expect(LoginRequestSchema.safeParse(validLoginRequest).success).toBeTruthy()
  })

  it('Should reject a LoginRequest missing the username', () => {
    expect(
      LoginRequestSchema.safeParse({ password: validLoginRequest.password }).success
    ).toBeFalsy()
  })

  it('Should reject a LoginRequest missing the password', () => {
    expect(
      LoginRequestSchema.safeParse({ username: validLoginRequest.username }).success
    ).toBeFalsy()
  })

  it('Should reject a LoginRequest with a non-string password', () => {
    expect(
      LoginRequestSchema.safeParse({ ...validLoginRequest, password: 1234 }).success
    ).toBeFalsy()
  })
})
