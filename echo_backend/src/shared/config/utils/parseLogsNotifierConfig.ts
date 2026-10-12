import { isLogLevel, parseRequiredEnv, type LogLevel } from '@echo/utilities'
import cron from 'node-cron'

import type { LogsNotifierConfig } from '../backConfig.js'

import { parseTimezone } from './parseTimezone.js'

const parseSchedule = (raw: string): string => {
  if (!cron.validate(raw)) {
    throw new Error(`Invalid cron expression: ${raw}`)
  }
  return raw
}

const parseWatchedLogsLevels = (raw: string): LogLevel[] => {
  const watchedLogsLevels = raw
    .split(',')
    .map((level) => level.trim())
    .filter((level) => isLogLevel(level))

  if (watchedLogsLevels.length === 0) {
    throw new Error(`No known log level in: ${raw}`)
  }
  return watchedLogsLevels
}

/**
 * Parses the `LOGS_NOTIFIER_*` variables of `processEnv` into the config of the cron notifying the
 * problem logs, completed with `serverName` and `lastLogsCheckFilePath`.
 *
 * The three variables are required. Throws when one is missing, when `LOGS_NOTIFIER_SCHEDULE` is
 * not a cron expression, when `LOGS_NOTIFIER_WATCHED_LOGS_LEVELS` names no log level (it is a
 * comma-separated list, whose unknown levels are ignored) or when `LOGS_NOTIFIER_TIMEZONE` is not
 * a known zone.
 */
export const parseLogsNotifierConfig = (
  processEnv: NodeJS.ProcessEnv,
  {
    serverName,
    lastLogsCheckFilePath
  }: Pick<LogsNotifierConfig, 'serverName' | 'lastLogsCheckFilePath'>
): LogsNotifierConfig => ({
  schedule: parseRequiredEnv(processEnv, 'LOGS_NOTIFIER_SCHEDULE', parseSchedule),
  watchedLogsLevels: parseRequiredEnv(
    processEnv,
    'LOGS_NOTIFIER_WATCHED_LOGS_LEVELS',
    parseWatchedLogsLevels
  ),
  notifierTimezone: parseRequiredEnv(processEnv, 'LOGS_NOTIFIER_TIMEZONE', parseTimezone),
  serverName,
  lastLogsCheckFilePath
})
