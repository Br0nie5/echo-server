import { describe, it, expect } from 'vitest'

import type { LoginRequest } from '../loginRequest.schema.js'
import { LoginRequestSchema } from '../loginRequest.schema.js'

const validLoginRequest: LoginRequest = { username: 'admin', password: 'secret' }

describe('LoginRequestSchema', () => {
  it('should accept a username and a password', () => {
    expect(LoginRequestSchema.safeParse(validLoginRequest).success).toBeTruthy()
  })

  it('should reject a LoginRequest missing the username', () => {
    expect(
      LoginRequestSchema.safeParse({ password: validLoginRequest.password }).success
    ).toBeFalsy()
  })

  it('should reject a LoginRequest missing the password', () => {
    expect(
      LoginRequestSchema.safeParse({ username: validLoginRequest.username }).success
    ).toBeFalsy()
  })

  it('should reject a LoginRequest with a non-string password', () => {
    expect(
      LoginRequestSchema.safeParse({ ...validLoginRequest, password: 1234 }).success
    ).toBeFalsy()
  })
})
