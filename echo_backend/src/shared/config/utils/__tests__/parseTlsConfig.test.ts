import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { describe, it, expect } from 'vitest'

import { parseTlsConfig } from '../parseTlsConfig.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = path.join(__dirname, '../../__tests__/fixtures')
const TEST_CERT_PATH = path.join(FIXTURES_DIR, 'test-cert.pem')
const TEST_KEY_PATH = path.join(FIXTURES_DIR, 'test-key.pem')

const TLS_ENV: NodeJS.ProcessEnv = { TLS_CERT_PATH: TEST_CERT_PATH, TLS_KEY_PATH: TEST_KEY_PATH }
const HTTPS_SERVER = { serverUrl: 'https://allowed-domain.com:3700' }

describe('parseTlsConfig', () => {
  it('should read cert and key file contents when both paths are set', () => {
    expect(parseTlsConfig(TLS_ENV, HTTPS_SERVER)).toStrictEqual({
      cert: readFileSync(TEST_CERT_PATH),
      key: readFileSync(TEST_KEY_PATH)
    })
  })

  it('should be undefined if neither TLS_CERT_PATH nor TLS_KEY_PATH are set', () => {
    expect(parseTlsConfig({}, HTTPS_SERVER)).toBeUndefined()
  })

  it('should be undefined if TLS_CERT_PATH and TLS_KEY_PATH are empty', () => {
    expect(parseTlsConfig({ TLS_CERT_PATH: '', TLS_KEY_PATH: '' }, HTTPS_SERVER)).toBeUndefined()
  })

  it('should throw if only TLS_CERT_PATH is set', () => {
    expect(() => parseTlsConfig({ TLS_CERT_PATH: TEST_CERT_PATH }, HTTPS_SERVER)).toThrow(
      'TLS_CERT_PATH and TLS_KEY_PATH must both be set to enable HTTPS'
    )
  })

  it('should throw if only TLS_KEY_PATH is set', () => {
    expect(() => parseTlsConfig({ TLS_KEY_PATH: TEST_KEY_PATH }, HTTPS_SERVER)).toThrow(
      'TLS_CERT_PATH and TLS_KEY_PATH must both be set to enable HTTPS'
    )
  })

  it('should throw if SERVER_URL is not https when TLS is enabled', () => {
    expect(() => parseTlsConfig(TLS_ENV, { serverUrl: 'http://allowed-domain.com:3700' })).toThrow(
      'SERVER_URL must use https:// when TLS_CERT_PATH and TLS_KEY_PATH are set'
    )
  })

  it('should throw if TLS_CERT_PATH does not point to a readable file', () => {
    expect(() =>
      parseTlsConfig(
        { ...TLS_ENV, TLS_CERT_PATH: path.join(FIXTURES_DIR, 'missing-cert.pem') },
        HTTPS_SERVER
      )
    ).toThrow()
  })
})
