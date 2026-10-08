import { describe, it, expect } from 'vitest'

import { parseCronConfig } from '../parseCronConfig.js'

const CRON_ENV: NodeJS.ProcessEnv = {
  LOGS_CRON_SCHEDULE_REGEX: '*/30 * * * *',
  LOGS_CRON_WATCHED_LOGS_CATEGORIES: 'WARNING,ERROR',
  LOGS_CRON_TELEGRAM_CHAT_ID: '123456789',
  LOGS_CRON_TELEGRAM_BASE_URL: 'https://api.telegram.org/bot123456789'
}

const CRON_CONSTANTS = {
  serverName: 'Echo',
  lastLogsCheckFilePath: '/data/last_logs_check.json'
}

describe('parseCronConfig', () => {
  it('should define the cron config if all the required variables are set', () => {
    expect(parseCronConfig(CRON_ENV, CRON_CONSTANTS)).toStrictEqual({
      schedule: '*/30 * * * *',
      watchedLogsCategories: ['WARNING', 'ERROR'],
      telegramChatId: '123456789',
      telegramBaseUrl: 'https://api.telegram.org/bot123456789',
      telegramTimezone: 'UTC',
      serverName: 'Echo',
      lastLogsCheckFilePath: '/data/last_logs_check.json'
    })
  })

  it.each([
    'LOGS_CRON_SCHEDULE_REGEX',
    'LOGS_CRON_WATCHED_LOGS_CATEGORIES',
    'LOGS_CRON_TELEGRAM_CHAT_ID',
    'LOGS_CRON_TELEGRAM_BASE_URL'
  ])('should not define the cron config if %s is not set', (key) => {
    expect(parseCronConfig({ ...CRON_ENV, [key]: undefined }, CRON_CONSTANTS)).toBeUndefined()
  })

  it('should not define the cron config if the schedule is not a cron expression', () => {
    expect(
      parseCronConfig(
        { ...CRON_ENV, LOGS_CRON_SCHEDULE_REGEX: 'invalid-cron-expression' },
        CRON_CONSTANTS
      )
    ).toBeUndefined()
  })

  describe('watched logs categories', () => {
    it('should ignore the spaces around the categories', () => {
      const cronConfig = parseCronConfig(
        { ...CRON_ENV, LOGS_CRON_WATCHED_LOGS_CATEGORIES: ' WARNING , ERROR ' },
        CRON_CONSTANTS
      )

      expect(cronConfig?.watchedLogsCategories).toStrictEqual(['WARNING', 'ERROR'])
    })

    it('should ignore the unknown categories', () => {
      const cronConfig = parseCronConfig(
        { ...CRON_ENV, LOGS_CRON_WATCHED_LOGS_CATEGORIES: 'WARNING,UNKNOWN' },
        CRON_CONSTANTS
      )

      expect(cronConfig?.watchedLogsCategories).toStrictEqual(['WARNING'])
    })

    it('should not define the cron config if no category is a known one', () => {
      expect(
        parseCronConfig(
          { ...CRON_ENV, LOGS_CRON_WATCHED_LOGS_CATEGORIES: 'UNKNOWN' },
          CRON_CONSTANTS
        )
      ).toBeUndefined()
    })
  })

  describe('telegram timezone', () => {
    it('should use the given LOGS_CRON_TELEGRAM_TIMEZONE', () => {
      const cronConfig = parseCronConfig(
        { ...CRON_ENV, LOGS_CRON_TELEGRAM_TIMEZONE: 'Europe/Paris' },
        CRON_CONSTANTS
      )

      expect(cronConfig?.telegramTimezone).toBe('Europe/Paris')
    })

    it('should throw if LOGS_CRON_TELEGRAM_TIMEZONE is not a known timezone', () => {
      expect(() =>
        parseCronConfig(
          { ...CRON_ENV, LOGS_CRON_TELEGRAM_TIMEZONE: 'Mars/Olympus' },
          CRON_CONSTANTS
        )
      ).toThrow('LOGS_CRON_TELEGRAM_TIMEZONE: Invalid timezone: Mars/Olympus')
    })

    it('should not read LOGS_CRON_TELEGRAM_TIMEZONE if the cron is disabled', () => {
      expect(
        parseCronConfig({ LOGS_CRON_TELEGRAM_TIMEZONE: 'Mars/Olympus' }, CRON_CONSTANTS)
      ).toBeUndefined()
    })
  })
})
