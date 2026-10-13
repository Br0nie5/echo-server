import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import type { Settings } from '../../../../../../initializers/settings/settings.js'
import { buildTestServer, type TestServer } from '../../../../../../test/buildTestServer.js'
import { getMockLogsNotifierConfig } from '../../../../../../test/mocks/mockConfigs.js'
import {
  getMockLogsNotifierSettings,
  getMockLogsSettings,
  getMockNotificationSettings,
  getMockSelfReportsSettings
} from '../../../../../../test/mocks/mockSettings.js'

/** The instant the server starts at: the cron checks the logs at each minute after it. */
const SERVER_START = new Date('2026-04-28T10:00:30.000Z')
const PREVIOUS_CHECK = new Date('2026-04-28T09:30:00.000Z')
const FIRST_CHECK = new Date('2026-04-28T10:01:00.000Z')
const SECOND_CHECK = new Date('2026-04-28T10:02:00.000Z')

const ONE_MINUTE_MILLISECONDS = 60 * 1000

const logsNotifierSettings = getMockLogsNotifierSettings({
  config: getMockLogsNotifierConfig({ schedule: '* * * * *' })
})
const notificationSettings = getMockNotificationSettings()

const logFilePath = '/logs/server/billing/logs/send_invoices.jsonl'
const { telegramBaseUrl, telegramBotToken } = notificationSettings
const telegramUrl = `${telegramBaseUrl}/bot${telegramBotToken}/sendMessage`

const toLogFileContent = (lines: object[]): string =>
  lines.map((line) => `${JSON.stringify(line)}\n`).join('')

const toLastCheckFileContent = (lastCheck: Date): string =>
  JSON.stringify({ lastCheck: lastCheck.toISOString() }, null, 2)

/** A log file with a problem log before the previous check, and two logs after it, one a problem. */
const logFileContent = toLogFileContent([
  {
    jobId: 11,
    timestamp: '2026-04-28T09:00:00.000Z',
    level: 'ERROR',
    message: 'Invoices not sent.'
  },
  {
    jobId: 12,
    timestamp: '2026-04-28T09:42:01.000Z',
    level: 'WARNING',
    message: 'Invoice 41 sent on attempt 2.'
  },
  { jobId: 12, timestamp: '2026-04-28T09:42:09.000Z', level: 'INFO', message: 'Invoices sent.' }
])

const fetchMock = vi.fn<typeof fetch>()

const buildServerWithLogsNotifier = (
  files: Record<string, string>,
  settings: Partial<Settings> = {}
): Promise<TestServer> =>
  buildTestServer({
    settings: {
      logs: getMockLogsSettings({ logsNotifier: logsNotifierSettings }),
      notification: notificationSettings,
      ...settings
    },
    files
  })

const getSentMessages = (): string[] =>
  fetchMock.mock.calls.map(
    ([, request]) => (JSON.parse(String(request?.body)) as { text: string }).text
  )

beforeEach(() => {
  vi.useFakeTimers({ now: SERVER_START })
  fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('logs notifier', () => {
  test('Should only save the date of its first check, and notify nothing', async () => {
    const { fileSystem } = await buildServerWithLogsNotifier({ [logFilePath]: logFileContent })

    await vi.advanceTimersByTimeAsync(ONE_MINUTE_MILLISECONDS)

    expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
      toLastCheckFileContent(FIRST_CHECK)
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('Should notify the problem logs logged since the previous check, once', async () => {
    const { fileSystem } = await buildServerWithLogsNotifier({
      [logFilePath]: logFileContent,
      [logsNotifierSettings.lastLogsCheckFilePath]: toLastCheckFileContent(PREVIOUS_CHECK)
    })

    await vi.advanceTimersByTimeAsync(ONE_MINUTE_MILLISECONDS)

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining(`"chat_id":"${notificationSettings.telegramChatId}"`)
    })
    expect(getSentMessages()).toMatchSnapshot()
    expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
      toLastCheckFileContent(FIRST_CHECK)
    )

    await vi.advanceTimersByTimeAsync(ONE_MINUTE_MILLISECONDS)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
      toLastCheckFileContent(SECOND_CHECK)
    )
  })

  test('Should notify the same logs at the next check when the notification could not be sent', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    const { fileSystem } = await buildServerWithLogsNotifier({
      [logFilePath]: logFileContent,
      [logsNotifierSettings.lastLogsCheckFilePath]: toLastCheckFileContent(PREVIOUS_CHECK)
    })

    await vi.advanceTimersByTimeAsync(ONE_MINUTE_MILLISECONDS)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
      toLastCheckFileContent(PREVIOUS_CHECK)
    )

    await vi.advanceTimersByTimeAsync(ONE_MINUTE_MILLISECONDS)

    const [firstMessage, secondMessage] = getSentMessages()
    expect(secondMessage).toBe(firstMessage)
    expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
      toLastCheckFileContent(SECOND_CHECK)
    )
  })

  test('Should save a self report in place of a notification that is too long for the channel', async () => {
    const selfReportsSettings = getMockSelfReportsSettings({
      fileName: 'logsNotifier.jsonl',
      sessionFilePath: '/fake/data/logs_notifier_self_reports_session.json'
    })
    const selfReportsFilePath = `${selfReportsSettings.dirPath}/${selfReportsSettings.fileName}`

    const { fileSystem } = await buildServerWithLogsNotifier(
      {
        [logFilePath]: logFileContent,
        [logsNotifierSettings.lastLogsCheckFilePath]: toLastCheckFileContent(PREVIOUS_CHECK)
      },
      {
        notification: getMockNotificationSettings({ telegramMessageSizeLimit: 10 }),
        logsNotifierSelfReports: selfReportsSettings
      }
    )

    await vi.advanceTimersByTimeAsync(ONE_MINUTE_MILLISECONDS)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(fileSystem.getFile(selfReportsFilePath)).toBe(
      toLogFileContent([
        {
          sessionId: 1,
          date: FIRST_CHECK.toISOString(),
          level: 'WARNING',
          message:
            'The problem logs were not notified: the notifier takes messages of 10 characters at most, which is not enough for any message',
          origin: 'checkProblemLogsAndNotify'
        }
      ])
    )
    expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
      toLastCheckFileContent(FIRST_CHECK)
    )
  })

  test('Should stop checking the logs once the server is closed', async () => {
    const { server, fileSystem } = await buildServerWithLogsNotifier({
      [logFilePath]: logFileContent
    })

    await server.close()
    await vi.advanceTimersByTimeAsync(ONE_MINUTE_MILLISECONDS)

    expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBeUndefined()
  })
})
