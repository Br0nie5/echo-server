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

  it('Should parse a fully provided config', () => {
    expect(parseConfig(rawConfig)).toEqual(fullConfig)
  })

  it('Should derive API_URL and APP_URL from SERVER_URL regardless of trailing slash', () => {
    expect(parseConfig({ ...rawConfig, SERVER_URL: 'https://example.com/' })).toEqual({
      ...fullConfig,
      SERVER_URL: 'https://example.com/'
    })
  })

  it('Should keep the path of SERVER_URL in API_URL and APP_URL', () => {
    expect(parseConfig({ ...rawConfig, SERVER_URL: 'https://example.com/tools/echo/' })).toEqual({
      ...fullConfig,
      SERVER_URL: 'https://example.com/tools/echo/',
      API_URL: 'https://example.com/tools/echo/api',
      APP_URL: 'https://example.com/tools/echo/app'
    })
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

  it('Should throw if SERVER_URL is missing', () => {
    expect(() => parseConfig({ ...rawConfig, SERVER_URL: undefined })).toThrow(
      'Missing required environment variable: SERVER_URL'
    )
  })

  it('Should throw if SERVER_URL is not a valid url', () => {
    expect(() => parseConfig({ ...rawConfig, SERVER_URL: 'not a valid url' })).toThrow(
      'Invalid SERVER_URL: not a valid url'
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

  it('Should throw if a value is an empty string', () => {
    expect(() => parseConfig({ ...rawConfig, SERVER_URL: '   ' })).toThrow(
      'Missing required environment variable: SERVER_URL'
    )
  })
})
