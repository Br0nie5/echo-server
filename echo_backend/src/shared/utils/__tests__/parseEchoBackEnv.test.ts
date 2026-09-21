import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { describe, it, expect, beforeEach, vi } from 'vitest'

import type { EchoBackEnv } from '../../types/echoBackEnv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = path.join(__dirname, 'fixtures')
const TEST_CERT_PATH = path.join(FIXTURES_DIR, 'test-cert.pem')
const TEST_KEY_PATH = path.join(FIXTURES_DIR, 'test-key.pem')

describe('env', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  const importEnv = async (): Promise<EchoBackEnv> => (await import('../parseEchoBackEnv.js')).env

  const stubRequiredEnvs = (): void => {
    vi.stubEnv('HTTP_PORT', '3000')
    vi.stubEnv('LOGS_DIR_PATH', '/some/path')
    vi.stubEnv('SERVER_URL', 'http://allowed-domain.com:3700')
    vi.stubEnv('HAS_AUTHENTICATION', 'true')
    vi.stubEnv('LOGS_CRON_SCHEDULE_REGEX', '*/30 * * * *')
    vi.stubEnv('LOGS_CRON_WATCHED_LOGS_CATEGORIES', 'WARNING,ERROR')
    vi.stubEnv('LOGS_CRON_TELEGRAM_CHAT_ID', '123456789')
    vi.stubEnv('LOGS_CRON_TELEGRAM_BASE_URL', 'https://api.telegram.org/bot123456789')
    vi.stubEnv('TLS_CERT_PATH', '')
    vi.stubEnv('TLS_KEY_PATH', '')
  }

  it('should use given values for needed keys', async () => {
    stubRequiredEnvs()

    const env = await importEnv()

    expect(env.HOST).toBe('0.0.0.0')
    expect(env.PORT).toBe(3000)
    expect(env.LOGS_DIR_PATH).toBe('/some/path')
    expect(env.ALLOWED_DOMAIN).toBe('allowed-domain.com')
  })

  describe('env files', () => {
    it('should load without errors in development mode', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      // Isolate from whatever local TLS setup the real .env file may carry (see stubRequiredEnvs).
      vi.stubEnv('TLS_CERT_PATH', '')
      vi.stubEnv('TLS_KEY_PATH', '')
      await expect(importEnv()).resolves.toBeDefined()
    })

    it('should load without errors in production mode', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      // Isolate from whatever local TLS setup the real .env file may carry (see stubRequiredEnvs).
      vi.stubEnv('TLS_CERT_PATH', '')
      vi.stubEnv('TLS_KEY_PATH', '')
      await expect(importEnv()).resolves.toBeDefined()
    })
  })

  describe('missing required variables', () => {
    it('should throw if HTTP_PORT is missing', async () => {
      stubRequiredEnvs()
      vi.stubEnv('HTTP_PORT', '')

      await expect(importEnv()).rejects.toThrow('Missing required environment variable: HTTP_PORT')
    })

    it('should throw if LOGS_DIR_PATH is missing', async () => {
      stubRequiredEnvs()
      vi.stubEnv('LOGS_DIR_PATH', '')

      await expect(importEnv()).rejects.toThrow(
        'Missing required environment variable: LOGS_DIR_PATH'
      )
    })

    it('should throw if HAS_AUTHENTICATION is missing', async () => {
      stubRequiredEnvs()
      vi.stubEnv('HAS_AUTHENTICATION', '')

      await expect(importEnv()).rejects.toThrow(
        'Missing required environment variable: HAS_AUTHENTICATION'
      )
    })

    it('should throw if SERVER_URL is missing', async () => {
      stubRequiredEnvs()
      vi.stubEnv('SERVER_URL', '')

      await expect(importEnv()).rejects.toThrow('Missing required environment variable: SERVER_URL')
    })
  })

  describe('HTTP_PORT', () => {
    it('should throw if HTTP_PORT is not a number', async () => {
      stubRequiredEnvs()
      vi.stubEnv('HTTP_PORT', 'not-a-number')

      await expect(importEnv()).rejects.toThrow('Invalid HTTP_PORT: not-a-number')
    })

    it('should throw if HTTP_PORT is not an integer', async () => {
      stubRequiredEnvs()
      vi.stubEnv('HTTP_PORT', '3000.5')

      await expect(importEnv()).rejects.toThrow('Invalid HTTP_PORT: 3000.5')
    })

    it('should throw if HTTP_PORT is out of range', async () => {
      stubRequiredEnvs()
      vi.stubEnv('HTTP_PORT', '70000')

      await expect(importEnv()).rejects.toThrow('Invalid HTTP_PORT: 70000')
    })

    it('should throw if HTTP_PORT is not a positive number', async () => {
      stubRequiredEnvs()
      vi.stubEnv('HTTP_PORT', '0')

      await expect(importEnv()).rejects.toThrow('Invalid HTTP_PORT: 0')
    })
  })

  describe('ALLOWED_DOMAIN', () => {
    it('should return localhost when SERVER_URL domain is an IP', async () => {
      stubRequiredEnvs()
      vi.stubEnv('SERVER_URL', 'http://192.168.1.1')

      const env = await importEnv()

      expect(env.ALLOWED_DOMAIN).toBe('localhost')
    })
  })

  describe('COOKIE_NAME', () => {
    it('should use allowed domain for cookie name', async () => {
      stubRequiredEnvs()

      const env = await importEnv()

      expect(env.COOKIE_NAME).toBe('allowed-domain.com_access_token')
    })
  })

  describe('COOKIE_DOMAIN', () => {
    it('should define cookie options domain and secure if allowed domain is not localhost', async () => {
      stubRequiredEnvs()

      const env = await importEnv()

      expect(env.COOKIE_SERIALIZE_OPTIONS).toStrictEqual({
        domain: 'allowed-domain.com',
        httpOnly: true,
        maxAge: 86400,
        path: '/',
        sameSite: 'lax',
        secure: true
      })
    })

    it('should not define cookie options domain and secure if allowed domain is localhost', async () => {
      stubRequiredEnvs()
      vi.stubEnv('SERVER_URL', 'http://localhost')

      const env = await importEnv()

      expect(env.COOKIE_SERIALIZE_OPTIONS).toStrictEqual({
        domain: undefined,
        httpOnly: true,
        maxAge: 86400,
        path: '/',
        sameSite: 'lax',
        secure: false
      })
    })
  })

  describe('LOGS_CRON_OPTIONS', () => {
    it('should define logs cron options if all required env vars are set', async () => {
      stubRequiredEnvs()

      const env = await importEnv()

      expect(env.LOGS_CRON_OPTIONS).toStrictEqual({
        LOGS_CRON_SCHEDULE_REGEX: '*/30 * * * *',
        WATCHED_LOGS_CATEGORIES: ['WARNING', 'ERROR'],
        TELEGRAM_CHAT_ID: '123456789',
        TELEGRAM_BASE_URL: 'https://api.telegram.org/bot123456789'
      })
    })

    it('should not define logs cron options if required env vars are not set', async () => {
      stubRequiredEnvs()
      vi.stubEnv('LOGS_CRON_SCHEDULE_REGEX', undefined)
      vi.stubEnv('LOGS_CRON_WATCHED_LOGS_CATEGORIES', undefined)
      vi.stubEnv('LOGS_CRON_TELEGRAM_CHAT_ID', undefined)
      vi.stubEnv('LOGS_CRON_TELEGRAM_BASE_URL', undefined)

      const env = await importEnv()

      expect(env.LOGS_CRON_OPTIONS).toBeUndefined()
    })

    it('should not define logs cron options if cron schedule is invalid', async () => {
      stubRequiredEnvs()
      vi.stubEnv('LOGS_CRON_SCHEDULE_REGEX', 'invalid-cron-expression')

      const env = await importEnv()

      expect(env.LOGS_CRON_OPTIONS).toBeUndefined()
    })
  })

  describe('TLS_OPTIONS', () => {
    it('should be undefined if neither TLS_CERT_PATH nor TLS_KEY_PATH are set', async () => {
      stubRequiredEnvs()

      const env = await importEnv()

      expect(env.TLS_OPTIONS).toBeUndefined()
    })

    it('should throw if TLS_CERT_PATH/TLS_KEY_PATH are set outside of production', async () => {
      stubRequiredEnvs()
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('SERVER_URL', 'https://allowed-domain.com:3700')
      vi.stubEnv('TLS_CERT_PATH', TEST_CERT_PATH)
      vi.stubEnv('TLS_KEY_PATH', TEST_KEY_PATH)

      await expect(importEnv()).rejects.toThrow(
        'TLS_CERT_PATH and TLS_KEY_PATH are only supported when NODE_ENV=production'
      )
    })

    it('should throw if only TLS_CERT_PATH is set', async () => {
      stubRequiredEnvs()
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('TLS_CERT_PATH', TEST_CERT_PATH)

      await expect(importEnv()).rejects.toThrow(
        'TLS_CERT_PATH and TLS_KEY_PATH must both be set to enable HTTPS'
      )
    })

    it('should throw if only TLS_KEY_PATH is set', async () => {
      stubRequiredEnvs()
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('TLS_KEY_PATH', TEST_KEY_PATH)

      await expect(importEnv()).rejects.toThrow(
        'TLS_CERT_PATH and TLS_KEY_PATH must both be set to enable HTTPS'
      )
    })

    it('should throw if SERVER_URL is not https when TLS is enabled', async () => {
      stubRequiredEnvs()
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('SERVER_URL', 'http://allowed-domain.com:3700')
      vi.stubEnv('TLS_CERT_PATH', TEST_CERT_PATH)
      vi.stubEnv('TLS_KEY_PATH', TEST_KEY_PATH)

      await expect(importEnv()).rejects.toThrow(
        'SERVER_URL must use https:// when TLS_CERT_PATH and TLS_KEY_PATH are set'
      )
    })

    it('should throw if TLS_CERT_PATH does not point to a readable file', async () => {
      stubRequiredEnvs()
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('SERVER_URL', 'https://allowed-domain.com:3700')
      vi.stubEnv('TLS_CERT_PATH', path.join(FIXTURES_DIR, 'missing-cert.pem'))
      vi.stubEnv('TLS_KEY_PATH', TEST_KEY_PATH)

      await expect(importEnv()).rejects.toThrow()
    })

    it('should read cert and key file contents when both paths are set', async () => {
      stubRequiredEnvs()
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('SERVER_URL', 'https://allowed-domain.com:3700')
      vi.stubEnv('TLS_CERT_PATH', TEST_CERT_PATH)
      vi.stubEnv('TLS_KEY_PATH', TEST_KEY_PATH)

      const env = await importEnv()

      expect(env.TLS_OPTIONS).toStrictEqual({
        cert: readFileSync(TEST_CERT_PATH),
        key: readFileSync(TEST_KEY_PATH)
      })
    })
  })
})
