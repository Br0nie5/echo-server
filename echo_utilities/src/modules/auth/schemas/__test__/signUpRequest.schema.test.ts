import { describe, it, expect } from 'vitest'

import type { SignUpRequest } from '../signUpRequest.schema.js'
import { SignUpRequestSchema } from '../signUpRequest.schema.js'

const validSignUpRequest: SignUpRequest = { username: 'admin', password: 'secret' }

describe('SignUpRequestSchema', () => {
  it('should accept a username and a password', () => {
    expect(SignUpRequestSchema.safeParse(validSignUpRequest).success).toBeTruthy()
  })

  it('should reject a SignUpRequest missing the username', () => {
    expect(
      SignUpRequestSchema.safeParse({ password: validSignUpRequest.password }).success
    ).toBeFalsy()
  })

  it('should reject a SignUpRequest missing the password', () => {
    expect(
      SignUpRequestSchema.safeParse({ username: validSignUpRequest.username }).success
    ).toBeFalsy()
  })

  it('should reject a SignUpRequest with a non-string password', () => {
    expect(
      SignUpRequestSchema.safeParse({ ...validSignUpRequest, password: 1234 }).success
    ).toBeFalsy()
  })
})
