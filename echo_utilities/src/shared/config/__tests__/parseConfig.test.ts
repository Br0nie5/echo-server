import { describe, it, expect } from 'vitest'

import type { Config } from '../config.js'
import { parseConfig } from '../parseConfig.js'

describe('parseConfig', () => {
  const rawConfig = {
    SERVER_NAME: 'prod-server',
    SERVER_URL: 'https://example.com',
    HAS_AUTHENTICATION: true
  }

  const fullConfig: Config = {
    SERVER_NAME: 'prod-server',
    SERVER_URL: 'https://example.com',
    API_URL: 'https://example.com/api',
    APP_URL: 'https://example.com/app',
    HAS_AUTHENTICATION: true
  }

  it('should parse a fully provided config', () => {
    expect(parseConfig(rawConfig as unknown)).toEqual(fullConfig)
  })

  it('should derive API_URL and APP_URL from SERVER_URL regardless of trailing slash', () => {
    expect(parseConfig({ ...rawConfig, SERVER_URL: 'https://example.com/' } as unknown)).toEqual({
      ...fullConfig,
      SERVER_URL: 'https://example.com/'
    })
  })

  it('should still parse a fully provided config if has_authentication is a string', () => {
    expect(parseConfig({ ...rawConfig, HAS_AUTHENTICATION: 'true' } as unknown)).toEqual(fullConfig)
    expect(parseConfig({ ...rawConfig, HAS_AUTHENTICATION: 'false' } as unknown)).toEqual({
      ...fullConfig,
      HAS_AUTHENTICATION: false
    })
  })

  it('should throw if SERVER_NAME is missing', () => {
    expect(() => parseConfig({ ...rawConfig, SERVER_NAME: undefined })).toThrow(
      'Missing required environment variable: SERVER_NAME'
    )
  })

  it('should throw if SERVER_URL is missing', () => {
    expect(() => parseConfig({ ...rawConfig, SERVER_URL: undefined })).toThrow(
      'Missing required environment variable: SERVER_URL'
    )
  })

  it('should throw if SERVER_URL is not a valid url', () => {
    expect(() => parseConfig({ ...rawConfig, SERVER_URL: 'not a valid url' })).toThrow(
      'Invalid SERVER_URL: not a valid url'
    )
  })

  it('should throw if HAS_AUTHENTICATION is missing', () => {
    expect(() => parseConfig({ ...rawConfig, HAS_AUTHENTICATION: undefined })).toThrow(
      'Missing required environment variable: HAS_AUTHENTICATION'
    )
  })

  it('should throw if HAS_AUTHENTICATION is an invalid string', () => {
    expect(() =>
      parseConfig({ ...rawConfig, HAS_AUTHENTICATION: 'not-a-boolean' } as unknown)
    ).toThrow('Missing required environment variable: HAS_AUTHENTICATION')
  })

  it('should throw if a value is an empty string', () => {
    expect(() => parseConfig({ ...rawConfig, SERVER_URL: '   ' })).toThrow(
      'Missing required environment variable: SERVER_URL'
    )
  })
})
