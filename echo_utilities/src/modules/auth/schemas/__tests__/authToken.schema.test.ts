import { describe, it, expect } from 'vitest'

import type { AuthToken } from '../authToken.schema.js'
import { AuthTokenSchema } from '../authToken.schema.js'

describe('AuthTokenSchema', () => {
  it('Should accept a valid AuthToken with a message', () => {
    const authToken: AuthToken = { success: true, message: 'Login successful.' }

    expect(AuthTokenSchema.safeParse(authToken).success).toBeTruthy()
  })

  it('Should accept a valid AuthToken without the optional message', () => {
    const authToken: AuthToken = { success: false }

    expect(AuthTokenSchema.safeParse(authToken).success).toBeTruthy()
  })

  it('Should reject an AuthToken missing the required success field', () => {
    expect(AuthTokenSchema.safeParse({ message: 'Login successful.' }).success).toBeFalsy()
  })

  it('Should reject an AuthToken with a non-boolean success field', () => {
    expect(AuthTokenSchema.safeParse({ success: 'true' }).success).toBeFalsy()
  })

  it('Should reject an AuthToken with an unknown extra property', () => {
    const authToken: AuthToken = { success: true, message: 'Login successful.' }

    expect(AuthTokenSchema.safeParse({ ...authToken, extra: 'not allowed' }).success).toBeFalsy()
  })
})
