import { describe, it, expect } from 'vitest'

import type { AuthToken } from '../../types/__generated__/authToken.js'
import { AuthTokenSchema } from '../auth.schema.js'

describe('AuthTokenSchema', () => {
  it('should accept a valid AuthToken with a message', () => {
    const authToken: AuthToken = { success: true, message: 'Login successful.' }

    expect(AuthTokenSchema.safeParse(authToken).success).toBeTruthy()
  })

  it('should accept a valid AuthToken without the optional message', () => {
    const authToken: AuthToken = { success: false }

    expect(AuthTokenSchema.safeParse(authToken).success).toBeTruthy()
  })

  it('should reject an AuthToken missing the required success field', () => {
    expect(AuthTokenSchema.safeParse({ message: 'Login successful.' }).success).toBeFalsy()
  })

  it('should reject an AuthToken with a non-boolean success field', () => {
    expect(AuthTokenSchema.safeParse({ success: 'true' }).success).toBeFalsy()
  })

  it('should reject an AuthToken with an unknown extra property', () => {
    const authToken: AuthToken = { success: true, message: 'Login successful.' }

    expect(AuthTokenSchema.safeParse({ ...authToken, extra: 'not allowed' }).success).toBeFalsy()
  })
})
