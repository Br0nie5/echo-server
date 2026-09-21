import { describe, it, expect } from 'vitest'

import type { EchoEnv } from '../../types/env.js'
import { parseEchoEnv } from '../parseEnv.js'

describe('parseEchoEnv', () => {
  const rawEnv = {
    SERVER_NAME: 'prod-server',
    SERVER_URL: 'https://example.com',
    HAS_AUTHENTICATION: true
  }

  const fullEnv: EchoEnv = {
    SERVER_NAME: 'prod-server',
    SERVER_URL: 'https://example.com',
    API_URL: 'https://example.com/api',
    APP_URL: 'https://example.com/app',
    HAS_AUTHENTICATION: true
  }

  it('should parse a fully provided env', () => {
    expect(parseEchoEnv(rawEnv as unknown)).toEqual(fullEnv)
  })

  it('should derive API_URL and APP_URL from SERVER_URL regardless of trailing slash', () => {
    expect(parseEchoEnv({ ...rawEnv, SERVER_URL: 'https://example.com/' } as unknown)).toEqual({
      ...fullEnv,
      SERVER_URL: 'https://example.com/'
    })
  })

  it('should still parse a fully provided env if has_authentication is a string', () => {
    expect(parseEchoEnv({ ...rawEnv, HAS_AUTHENTICATION: 'true' } as unknown)).toEqual(fullEnv)
    expect(parseEchoEnv({ ...rawEnv, HAS_AUTHENTICATION: 'false' } as unknown)).toEqual({
      ...fullEnv,
      HAS_AUTHENTICATION: false
    })
  })

  it('should throw if SERVER_NAME is missing', () => {
    expect(() => parseEchoEnv({ ...rawEnv, SERVER_NAME: undefined })).toThrow(
      'Missing required environment variable: SERVER_NAME'
    )
  })

  it('should throw if SERVER_URL is missing', () => {
    expect(() => parseEchoEnv({ ...rawEnv, SERVER_URL: undefined })).toThrow(
      'Missing required environment variable: SERVER_URL'
    )
  })

  it('should throw if SERVER_URL is not a valid url', () => {
    expect(() => parseEchoEnv({ ...rawEnv, SERVER_URL: 'not a valid url' })).toThrow(
      'Invalid SERVER_URL: not a valid url'
    )
  })

  it('should throw if HAS_AUTHENTICATION is missing', () => {
    expect(() => parseEchoEnv({ ...rawEnv, HAS_AUTHENTICATION: undefined })).toThrow(
      'Missing required environment variable: HAS_AUTHENTICATION'
    )
  })

  it('should throw if HAS_AUTHENTICATION is an invalid string', () => {
    expect(() =>
      parseEchoEnv({ ...rawEnv, HAS_AUTHENTICATION: 'not-a-boolean' } as unknown)
    ).toThrow('Missing required environment variable: HAS_AUTHENTICATION')
  })

  it('should throw if a value is an empty string', () => {
    expect(() => parseEchoEnv({ ...rawEnv, SERVER_URL: '   ' })).toThrow(
      'Missing required environment variable: SERVER_URL'
    )
  })
})
