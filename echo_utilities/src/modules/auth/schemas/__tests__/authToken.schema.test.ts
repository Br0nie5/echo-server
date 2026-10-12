import { describe, it, expect } from 'vitest'

import type { AuthToken } from '../authToken.schema.js'
import { AuthTokenSchema } from '../authToken.schema.js'

describe('AuthTokenSchema', () => {
  it.each<AuthToken>([
    { success: true, message: 'Login successful.' },
    { success: false, message: 'Invalid credentials.' },
    { success: true }
  ])('Should accept the answer %j', (authToken) => {
    expect(AuthTokenSchema.parse(authToken)).toEqual(authToken)
  })

  it.each([
    { reason: 'without success', answer: { message: 'Login successful.' } },
    { reason: 'with a success that is not a boolean', answer: { success: 'true' } },
    { reason: 'with a message that is not a text', answer: { success: true, message: 404 } },
    { reason: 'with a property it does not describe', answer: { success: true, token: 'abc' } },
    { reason: 'that is not an object', answer: 'success' }
  ])('Should refuse an answer $reason', ({ answer }) => {
    expect(AuthTokenSchema.safeParse(answer).success).toBe(false)
  })
})
