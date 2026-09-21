import { describe, it, expect } from 'vitest'

import { AuthTokenSchema, LoginRequestSchema, SignUpRequestSchema } from '../auth.schemas.js'

describe('Auth Schemas', () => {
  // --- AuthTokenSchema Tests ---
  describe('AuthTokenSchema', () => {
    it('should be a constant object export', () => {
      expect(typeof AuthTokenSchema).toBe('object')
      expect(AuthTokenSchema).toBeDefined()
    })

    it('should define the correct JSON Schema properties', () => {
      expect(AuthTokenSchema.$id).toBe('AuthToken')
      expect(AuthTokenSchema.type).toBe('object')
    })

    it('should define the required fields correctly', () => {
      expect(AuthTokenSchema.required).toEqual(['success'])
    })

    it('should define properties with correct types and descriptions', () => {
      // success property
      expect(AuthTokenSchema.properties.success.type).toBe('boolean')
      expect(AuthTokenSchema.properties.success.description).toBe(
        'True if authentication was successful.'
      )

      // message property
      expect(AuthTokenSchema.properties.message.type).toBe('string')
      expect(AuthTokenSchema.properties.message.description).toBe('Status message.')
    })
  })

  // --- LoginRequestSchema Tests ---
  describe('LoginRequestSchema', () => {
    it('should be a constant object export', () => {
      expect(typeof LoginRequestSchema).toBe('object')
      expect(LoginRequestSchema).toBeDefined()
    })

    it('should define the correct JSON Schema properties', () => {
      expect(LoginRequestSchema.$id).toBe('LoginRequest')
      expect(LoginRequestSchema.type).toBe('object')
    })

    it('should define the required fields correctly', () => {
      expect(LoginRequestSchema.required).toEqual(['username', 'password'])
    })

    it('should define properties with correct types and descriptions', () => {
      // username property
      expect(LoginRequestSchema.properties.username.type).toBe('string')
      expect(LoginRequestSchema.properties.username.description).toBe('The user username.')

      // password property
      expect(LoginRequestSchema.properties.password.type).toBe('string')
      expect(LoginRequestSchema.properties.password.description).toBe('The user password.')
    })
  })

  // --- SignUpRequestSchema Tests ---
  describe('SignUpRequestSchema', () => {
    it('should be a constant object export', () => {
      expect(typeof SignUpRequestSchema).toBe('object')
      expect(SignUpRequestSchema).toBeDefined()
    })

    it('should define the correct JSON Schema properties', () => {
      expect(SignUpRequestSchema.$id).toBe('SignUpRequest')
      expect(SignUpRequestSchema.type).toBe('object')
    })

    it('should define the required fields correctly', () => {
      expect(SignUpRequestSchema.required).toEqual(['username', 'password'])
    })

    it('should define properties with correct types and descriptions', () => {
      // username property
      expect(SignUpRequestSchema.properties.username.type).toBe('string')
      expect(SignUpRequestSchema.properties.username.description).toBe('The wanted username.')

      // password property
      expect(SignUpRequestSchema.properties.password.type).toBe('string')
      expect(SignUpRequestSchema.properties.password.description).toBe('The wanted password.')
    })
  })
})
