import { describe, it, expect } from 'vitest'

import { parseLogsNotifierConfig } from '../parseLogsNotifierConfig.js'

const CRON_ENV: NodeJS.ProcessEnv = {
  LOGS_NOTIFIER_SCHEDULE: '*/30 * * * *',
  LOGS_NOTIFIER_WATCHED_LOGS_LEVELS: 'WARNING,ERROR'
}

const CRON_CONSTANTS = {
  serverName: 'Echo',
  lastLogsCheckFilePath: '/data/last_logs_check.json'
}

describe('parseLogsNotifierConfig', () => {
  it('Should define the logs notifier config if all the required variables are set', () => {
    expect(parseLogsNotifierConfig(CRON_ENV, CRON_CONSTANTS)).toStrictEqual({
      schedule: '*/30 * * * *',
      watchedLogsLevels: ['WARNING', 'ERROR'],
      notifierTimezone: 'UTC',
      serverName: 'Echo',
      lastLogsCheckFilePath: '/data/last_logs_check.json'
    })
  })

  it.each(['LOGS_NOTIFIER_SCHEDULE', 'LOGS_NOTIFIER_WATCHED_LOGS_LEVELS'])(
    'Should not define the logs notifier config if %s is not set',
    (key) => {
      expect(
        parseLogsNotifierConfig({ ...CRON_ENV, [key]: undefined }, CRON_CONSTANTS)
      ).toBeUndefined()
    }
  )

  it('Should throw if the schedule is not a cron expression', () => {
    expect(() =>
      parseLogsNotifierConfig(
        { ...CRON_ENV, LOGS_NOTIFIER_SCHEDULE: 'invalid-cron-expression' },
        CRON_CONSTANTS
      )
    ).toThrow('LOGS_NOTIFIER_SCHEDULE: Invalid cron expression: invalid-cron-expression')
  })

  it('Should not read the schedule if no level is watched', () => {
    expect(
      parseLogsNotifierConfig({ LOGS_NOTIFIER_SCHEDULE: 'invalid-cron-expression' }, CRON_CONSTANTS)
    ).toBeUndefined()
  })

  describe('watched logs levels', () => {
    it('Should ignore the spaces around the levels', () => {
      const logsNotifierConfig = parseLogsNotifierConfig(
        { ...CRON_ENV, LOGS_NOTIFIER_WATCHED_LOGS_LEVELS: ' WARNING , ERROR ' },
        CRON_CONSTANTS
      )

      expect(logsNotifierConfig?.watchedLogsLevels).toStrictEqual(['WARNING', 'ERROR'])
    })

    it('Should ignore the unknown levels', () => {
      const logsNotifierConfig = parseLogsNotifierConfig(
        { ...CRON_ENV, LOGS_NOTIFIER_WATCHED_LOGS_LEVELS: 'WARNING,UNKNOWN' },
        CRON_CONSTANTS
      )

      expect(logsNotifierConfig?.watchedLogsLevels).toStrictEqual(['WARNING'])
    })

    it('Should not define the logs notifier config if no level is a known one', () => {
      expect(
        parseLogsNotifierConfig(
          { ...CRON_ENV, LOGS_NOTIFIER_WATCHED_LOGS_LEVELS: 'UNKNOWN' },
          CRON_CONSTANTS
        )
      ).toBeUndefined()
    })
  })

  describe('telegram timezone', () => {
    it('Should use the given LOGS_NOTIFIER_TIMEZONE', () => {
      const logsNotifierConfig = parseLogsNotifierConfig(
        { ...CRON_ENV, LOGS_NOTIFIER_TIMEZONE: 'Europe/Paris' },
        CRON_CONSTANTS
      )

      expect(logsNotifierConfig?.notifierTimezone).toBe('Europe/Paris')
    })

    it('Should throw if LOGS_NOTIFIER_TIMEZONE is not a known timezone', () => {
      expect(() =>
        parseLogsNotifierConfig(
          { ...CRON_ENV, LOGS_NOTIFIER_TIMEZONE: 'Mars/Olympus' },
          CRON_CONSTANTS
        )
      ).toThrow('LOGS_NOTIFIER_TIMEZONE: Invalid timezone: Mars/Olympus')
    })

    it('Should not read LOGS_NOTIFIER_TIMEZONE if the cron is disabled', () => {
      expect(
        parseLogsNotifierConfig({ LOGS_NOTIFIER_TIMEZONE: 'Mars/Olympus' }, CRON_CONSTANTS)
      ).toBeUndefined()
    })
  })
})
