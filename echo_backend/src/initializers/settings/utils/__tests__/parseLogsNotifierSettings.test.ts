import { describe, it, expect } from 'vitest'

import { parseLogsNotifierSettings } from '../parseLogsNotifierSettings.js'

const CRON_ENV: NodeJS.ProcessEnv = {
  LOGS_NOTIFIER_SCHEDULE: '*/30 * * * *',
  LOGS_NOTIFIER_WATCHED_LOGS_LEVELS: 'WARNING,ERROR',
  LOGS_NOTIFIER_TIMEZONE: 'Europe/Paris'
}

const CRON_CONSTANTS = {
  serverName: 'Echo',
  lastLogsCheckFilePath: '/data/last_logs_check.json'
}

describe('parseLogsNotifierSettings', () => {
  it('Should build the logs notifier settings from its three variables', () => {
    expect(parseLogsNotifierSettings(CRON_ENV, CRON_CONSTANTS)).toStrictEqual({
      config: {
        schedule: '*/30 * * * *',
        watchedLogsLevels: ['WARNING', 'ERROR'],
        timezone: 'Europe/Paris',
        serverName: 'Echo'
      },
      lastLogsCheckFilePath: '/data/last_logs_check.json'
    })
  })

  it.each([
    'LOGS_NOTIFIER_SCHEDULE',
    'LOGS_NOTIFIER_WATCHED_LOGS_LEVELS',
    'LOGS_NOTIFIER_TIMEZONE'
  ])('Should throw if %s is not set', (key) => {
    expect(() =>
      parseLogsNotifierSettings({ ...CRON_ENV, [key]: undefined }, CRON_CONSTANTS)
    ).toThrow(`Missing required environment variable: ${key}`)
  })

  it('Should throw if the schedule is not a cron expression', () => {
    expect(() =>
      parseLogsNotifierSettings(
        { ...CRON_ENV, LOGS_NOTIFIER_SCHEDULE: 'invalid-cron-expression' },
        CRON_CONSTANTS
      )
    ).toThrow('LOGS_NOTIFIER_SCHEDULE: Invalid cron expression: invalid-cron-expression')
  })

  describe('watched logs levels', () => {
    it('Should ignore the spaces around the levels', () => {
      const logsNotifierSettings = parseLogsNotifierSettings(
        { ...CRON_ENV, LOGS_NOTIFIER_WATCHED_LOGS_LEVELS: ' WARNING , ERROR ' },
        CRON_CONSTANTS
      )

      expect(logsNotifierSettings.config.watchedLogsLevels).toStrictEqual(['WARNING', 'ERROR'])
    })

    it('Should ignore the unknown levels', () => {
      const logsNotifierSettings = parseLogsNotifierSettings(
        { ...CRON_ENV, LOGS_NOTIFIER_WATCHED_LOGS_LEVELS: 'WARNING,UNKNOWN' },
        CRON_CONSTANTS
      )

      expect(logsNotifierSettings.config.watchedLogsLevels).toStrictEqual(['WARNING'])
    })

    it('Should throw if no level is a known one', () => {
      expect(() =>
        parseLogsNotifierSettings(
          { ...CRON_ENV, LOGS_NOTIFIER_WATCHED_LOGS_LEVELS: 'UNKNOWN' },
          CRON_CONSTANTS
        )
      ).toThrow('LOGS_NOTIFIER_WATCHED_LOGS_LEVELS: No known log level in: UNKNOWN')
    })
  })

  it('Should throw if LOGS_NOTIFIER_TIMEZONE is not a known timezone', () => {
    expect(() =>
      parseLogsNotifierSettings(
        { ...CRON_ENV, LOGS_NOTIFIER_TIMEZONE: 'Mars/Olympus' },
        CRON_CONSTANTS
      )
    ).toThrow('LOGS_NOTIFIER_TIMEZONE: Invalid timezone: Mars/Olympus')
  })
})
