import { describe, it, expect } from 'vitest'

import type { SignUpRequest } from '../signUpRequest.schema.js'
import { SignUpRequestSchema } from '../signUpRequest.schema.js'

const signUpRequest: SignUpRequest = { username: 'admin', password: 'secret' }

describe('SignUpRequestSchema', () => {
  it('Should accept a username and a password', () => {
    expect(SignUpRequestSchema.parse(signUpRequest)).toEqual(signUpRequest)
  })

  it('Should leave out the properties it does not describe', () => {
    expect(SignUpRequestSchema.parse({ ...signUpRequest, isAdmin: true })).toEqual(signUpRequest)
  })

  it.each([
    { reason: 'without username', body: { password: 'secret' } },
    { reason: 'without password', body: { username: 'admin' } },
    { reason: 'with a username that is not a text', body: { ...signUpRequest, username: 1234 } },
    { reason: 'with a password that is not a text', body: { ...signUpRequest, password: 1234 } },
    { reason: 'with an empty username', body: { ...signUpRequest, username: '' } },
    { reason: 'with an empty password', body: { ...signUpRequest, password: '' } },
    { reason: 'that is not an object', body: 'admin:secret' }
  ])('Should refuse a body $reason', ({ body }) => {
    expect(SignUpRequestSchema.safeParse(body).success).toBe(false)
  })
})
