import { describe, it, expect } from 'vitest'

import { parseLogsNotifierConfig } from '../parseLogsNotifierConfig.js'

const CRON_ENV: NodeJS.ProcessEnv = {
  LOGS_NOTIFIER_SCHEDULE_REGEX: '*/30 * * * *',
  LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES: 'WARNING,ERROR'
}

const CRON_CONSTANTS = {
  serverName: 'Echo',
  lastLogsCheckFilePath: '/data/last_logs_check.json'
}

describe('parseLogsNotifierConfig', () => {
  it('should define the logs notifier config if all the required variables are set', () => {
    expect(parseLogsNotifierConfig(CRON_ENV, CRON_CONSTANTS)).toStrictEqual({
      schedule: '*/30 * * * *',
      watchedLogsCategories: ['WARNING', 'ERROR'],
      notifierTimezone: 'UTC',
      serverName: 'Echo',
      lastLogsCheckFilePath: '/data/last_logs_check.json'
    })
  })

  it.each(['LOGS_NOTIFIER_SCHEDULE_REGEX', 'LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES'])(
    'should not define the logs notifier config if %s is not set',
    (key) => {
      expect(
        parseLogsNotifierConfig({ ...CRON_ENV, [key]: undefined }, CRON_CONSTANTS)
      ).toBeUndefined()
    }
  )

  it('should throw if the schedule is not a cron expression', () => {
    expect(() =>
      parseLogsNotifierConfig(
        { ...CRON_ENV, LOGS_NOTIFIER_SCHEDULE_REGEX: 'invalid-cron-expression' },
        CRON_CONSTANTS
      )
    ).toThrow('LOGS_NOTIFIER_SCHEDULE_REGEX: Invalid cron expression: invalid-cron-expression')
  })

  it('should not read the schedule if no category is watched', () => {
    expect(
      parseLogsNotifierConfig(
        { LOGS_NOTIFIER_SCHEDULE_REGEX: 'invalid-cron-expression' },
        CRON_CONSTANTS
      )
    ).toBeUndefined()
  })

  describe('watched logs categories', () => {
    it('should ignore the spaces around the categories', () => {
      const logsNotifierConfig = parseLogsNotifierConfig(
        { ...CRON_ENV, LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES: ' WARNING , ERROR ' },
        CRON_CONSTANTS
      )

      expect(logsNotifierConfig?.watchedLogsCategories).toStrictEqual(['WARNING', 'ERROR'])
    })

    it('should ignore the unknown categories', () => {
      const logsNotifierConfig = parseLogsNotifierConfig(
        { ...CRON_ENV, LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES: 'WARNING,UNKNOWN' },
        CRON_CONSTANTS
      )

      expect(logsNotifierConfig?.watchedLogsCategories).toStrictEqual(['WARNING'])
    })

    it('should not define the logs notifier config if no category is a known one', () => {
      expect(
        parseLogsNotifierConfig(
          { ...CRON_ENV, LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES: 'UNKNOWN' },
          CRON_CONSTANTS
        )
      ).toBeUndefined()
    })
  })

  describe('telegram timezone', () => {
    it('should use the given LOGS_NOTIFIER_TIMEZONE', () => {
      const logsNotifierConfig = parseLogsNotifierConfig(
        { ...CRON_ENV, LOGS_NOTIFIER_TIMEZONE: 'Europe/Paris' },
        CRON_CONSTANTS
      )

      expect(logsNotifierConfig?.notifierTimezone).toBe('Europe/Paris')
    })

    it('should throw if LOGS_NOTIFIER_TIMEZONE is not a known timezone', () => {
      expect(() =>
        parseLogsNotifierConfig(
          { ...CRON_ENV, LOGS_NOTIFIER_TIMEZONE: 'Mars/Olympus' },
          CRON_CONSTANTS
        )
      ).toThrow('LOGS_NOTIFIER_TIMEZONE: Invalid timezone: Mars/Olympus')
    })

    it('should not read LOGS_NOTIFIER_TIMEZONE if the cron is disabled', () => {
      expect(
        parseLogsNotifierConfig({ LOGS_NOTIFIER_TIMEZONE: 'Mars/Olympus' }, CRON_CONSTANTS)
      ).toBeUndefined()
    })
  })
})
