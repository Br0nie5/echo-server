import { describe, it, expect } from 'vitest'

import type { LoginRequest } from '../loginRequest.schema.js'
import { LoginRequestSchema } from '../loginRequest.schema.js'

const loginRequest: LoginRequest = { username: 'admin', password: 'secret' }

describe('LoginRequestSchema', () => {
  it('Should accept a username and a password', () => {
    expect(LoginRequestSchema.parse(loginRequest)).toEqual(loginRequest)
  })

  it('Should leave out the properties it does not describe', () => {
    expect(LoginRequestSchema.parse({ ...loginRequest, isAdmin: true })).toEqual(loginRequest)
  })

  it.each([
    { reason: 'without username', body: { password: 'secret' } },
    { reason: 'without password', body: { username: 'admin' } },
    { reason: 'with a username that is not a text', body: { ...loginRequest, username: 1234 } },
    { reason: 'with a password that is not a text', body: { ...loginRequest, password: 1234 } },
    { reason: 'with an empty username', body: { ...loginRequest, username: '' } },
    { reason: 'with an empty password', body: { ...loginRequest, password: '' } },
    { reason: 'that is not an object', body: 'admin:secret' }
  ])('Should refuse a body $reason', ({ body }) => {
    expect(LoginRequestSchema.safeParse(body).success).toBe(false)
  })
})
