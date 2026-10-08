import { isLogCategory } from '@echo/utilities'
import cron from 'node-cron'

import type { CronConfig } from '../backConfig.js'

import { addEnvNameToError } from './addEnvNameToError.js'
import { parseTimezone } from './parseTimezone.js'

/**
 * Parses the `LOGS_CRON_*` variables of `processEnv` into the config of the cron notifying the
 * problem logs on Telegram, completed with `serverName` and `lastLogsCheckFilePath`.
 *
 * It is `undefined`, which disables the cron, unless `LOGS_CRON_SCHEDULE_REGEX` is a valid cron
 * expression, `LOGS_CRON_WATCHED_LOGS_CATEGORIES` names at least one log category (it is a
 * comma-separated list, whose unknown categories are ignored), and `LOGS_CRON_TELEGRAM_CHAT_ID`
 * and `LOGS_CRON_TELEGRAM_BASE_URL` are set. Throws on an invalid `LOGS_CRON_TELEGRAM_TIMEZONE`
 * when the cron is enabled.
 */
export const parseCronConfig = (
  processEnv: NodeJS.ProcessEnv,
  { serverName, lastLogsCheckFilePath }: Pick<CronConfig, 'serverName' | 'lastLogsCheckFilePath'>
): CronConfig | undefined => {
  const schedule = processEnv.LOGS_CRON_SCHEDULE_REGEX
  const telegramChatId = processEnv.LOGS_CRON_TELEGRAM_CHAT_ID
  const telegramBaseUrl = processEnv.LOGS_CRON_TELEGRAM_BASE_URL

  const watchedLogsCategories = processEnv.LOGS_CRON_WATCHED_LOGS_CATEGORIES?.split(',')
    .map((category) => category.trim())
    .filter((category) => isLogCategory(category))

  if (
    !schedule ||
    !cron.validate(schedule) ||
    !watchedLogsCategories ||
    watchedLogsCategories.length === 0 ||
    !telegramChatId ||
    !telegramBaseUrl
  ) {
    return undefined
  }

  return {
    schedule,
    watchedLogsCategories,
    telegramChatId,
    telegramBaseUrl,
    telegramTimezone: addEnvNameToError('LOGS_CRON_TELEGRAM_TIMEZONE', () =>
      parseTimezone(processEnv.LOGS_CRON_TELEGRAM_TIMEZONE)
    ),
    serverName,
    lastLogsCheckFilePath
  }
}
