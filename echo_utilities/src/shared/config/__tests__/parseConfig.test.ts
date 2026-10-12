import { describe, it, expect } from 'vitest'

import type { Config } from '../config.js'
import { parseConfig } from '../parseConfig.js'

describe('parseConfig', () => {
  const rawConfig = {
    SERVER_NAME: 'prod-server',
    HAS_AUTHENTICATION: 'true'
  }

  const fullConfig: Config = {
    SERVER_NAME: 'prod-server',
    HAS_AUTHENTICATION: true
  }

  it('Should parse a fully provided config', () => {
    expect(parseConfig(rawConfig)).toEqual(fullConfig)
  })

  it('Should leave out the variables it does not read', () => {
    expect(parseConfig({ ...rawConfig, HTTP_PORT: '4000' })).toEqual(fullConfig)
  })

  it('Should still parse a fully provided config if HAS_AUTHENTICATION is a boolean', () => {
    expect(parseConfig({ ...rawConfig, HAS_AUTHENTICATION: false })).toEqual({
      ...fullConfig,
      HAS_AUTHENTICATION: false
    })
  })

  it.each([undefined, '   '])('Should throw if SERVER_NAME is missing or blank (%j)', (value) => {
    expect(() => parseConfig({ ...rawConfig, SERVER_NAME: value })).toThrow(
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
      'HAS_AUTHENTICATION: Invalid boolean: not-a-boolean is neither true nor false'
    )
  })
})
