import { describe, it, expect } from 'vitest'

import type { Config } from '../config.js'
import { parseConfig } from '../parseConfig.js'

describe('parseConfig', () => {
  const rawConfig = {
    SERVER_NAME: 'prod-server',
    HAS_AUTHENTICATION: true
  }

  const fullConfig: Config = {
    SERVER_NAME: 'prod-server',
    HAS_AUTHENTICATION: true
  }

  it('Should parse a fully provided config', () => {
    expect(parseConfig(rawConfig)).toEqual(fullConfig)
  })

  it('Should leave out the variables it does not read', () => {
    expect(parseConfig({ ...rawConfig, SERVER_URL: 'https://example.com' })).toEqual(fullConfig)
  })

  it('Should still parse a fully provided config if HAS_AUTHENTICATION is a string', () => {
    expect(parseConfig({ ...rawConfig, HAS_AUTHENTICATION: 'true' })).toEqual(fullConfig)
    expect(parseConfig({ ...rawConfig, HAS_AUTHENTICATION: ' false ' })).toEqual({
      ...fullConfig,
      HAS_AUTHENTICATION: false
    })
  })

  it('Should throw if SERVER_NAME is missing', () => {
    expect(() => parseConfig({ ...rawConfig, SERVER_NAME: undefined })).toThrow(
      'Missing required environment variable: SERVER_NAME'
    )
  })

  it('Should throw if SERVER_NAME is an empty string', () => {
    expect(() => parseConfig({ ...rawConfig, SERVER_NAME: '   ' })).toThrow(
      'Missing required environment variable: SERVER_NAME'
    )
  })

  it('Should throw if HAS_AUTHENTICATION is missing', () => {
    expect(() => parseConfig({ ...rawConfig, HAS_AUTHENTICATION: undefined })).toThrow(
      'Missing required environment variable: HAS_AUTHENTICATION'
    )
  })

  it('Should throw if HAS_AUTHENTICATION is neither true nor false', () => {
    expect(() => parseConfig({ ...rawConfig, HAS_AUTHENTICATION: 'not-a-boolean' })).toThrow(
      'Invalid environment variable HAS_AUTHENTICATION: not-a-boolean, it should be true or false'
    )
    expect(() => parseConfig({ ...rawConfig, HAS_AUTHENTICATION: 1 })).toThrow(
      'Invalid environment variable HAS_AUTHENTICATION: 1, it should be true or false'
    )
  })
})
