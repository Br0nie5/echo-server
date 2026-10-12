import { describe, it, expect } from 'vitest'

import type { LoginRequest } from '../loginRequest.schema.js'
import { LoginRequestSchema } from '../loginRequest.schema.js'

const loginRequest: LoginRequest = { username: 'admin', password: 'secret' }

describe('LoginRequestSchema', () => {
  it('Should accept a username and a password', () => {
    expect(LoginRequestSchema.parse(loginRequest)).toEqual(loginRequest)
  })

  it.each([
    { reason: 'without username', body: { password: 'secret' } },
    { reason: 'without password', body: { username: 'admin' } },
    { reason: 'with a username that is not a text', body: { ...loginRequest, username: 1234 } },
    { reason: 'with a password that is not a text', body: { ...loginRequest, password: 1234 } },
    { reason: 'that is not an object', body: 'admin:secret' }
  ])('Should refuse a body $reason', ({ body }) => {
    expect(LoginRequestSchema.safeParse(body).success).toBe(false)
  })
})
