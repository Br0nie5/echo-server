import { isLogCategory } from '@echo/utilities'
import cron from 'node-cron'

import type { LogsNotifierConfig } from '../backConfig.js'

import { addEnvNameToError } from './addEnvNameToError.js'
import { parseTimezone } from './parseTimezone.js'

/**
 * Parses the `LOGS_NOTIFIER_*` variables of `processEnv` into the config of the cron notifying the
 * problem logs, completed with `serverName` and `lastLogsCheckFilePath`.
 *
 * It is `undefined`, which disables the cron, unless `LOGS_NOTIFIER_SCHEDULE_REGEX` is a valid cron
 * expression and `LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES` names at least one log category (it is a
 * comma-separated list, whose unknown categories are ignored). Throws on an invalid
 * `LOGS_NOTIFIER_TIMEZONE` when the cron is enabled.
 */
export const parseLogsNotifierConfig = (
  processEnv: NodeJS.ProcessEnv,
  {
    serverName,
    lastLogsCheckFilePath
  }: Pick<LogsNotifierConfig, 'serverName' | 'lastLogsCheckFilePath'>
): LogsNotifierConfig | undefined => {
  const schedule = processEnv.LOGS_NOTIFIER_SCHEDULE_REGEX

  const watchedLogsCategories = processEnv.LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES?.split(',')
    .map((category) => category.trim())
    .filter((category) => isLogCategory(category))

  if (
    !schedule ||
    !cron.validate(schedule) ||
    !watchedLogsCategories ||
    watchedLogsCategories.length === 0
  ) {
    return undefined
  }

  return {
    schedule,
    watchedLogsCategories,
    notifierTimezone: addEnvNameToError('LOGS_NOTIFIER_TIMEZONE', () =>
      parseTimezone(processEnv.LOGS_NOTIFIER_TIMEZONE)
    ),
    serverName,
    lastLogsCheckFilePath
  }
}
