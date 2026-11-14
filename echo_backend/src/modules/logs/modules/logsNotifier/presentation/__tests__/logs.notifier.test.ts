import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import type { Settings } from '../../../../../../initializers/settings/settings.js'
import { buildTestServer, type TestServer } from '../../../../../../test/buildTestServer.js'
import { getMockLogsNotifierConfig } from '../../../../../../test/mocks/mockConfigs.js'
import {
  getMockLogsNotifierSettings,
  getMockLogsSettings,
  getMockNotificationSettings,
  getMockNotificationsSelfReportsSettings
} from '../../../../../../test/mocks/mockSettings.js'
import { toJsonLinesFileContent } from '../../../../../../test/utils/toJsonLinesFileContent.js'

/**
 * The instant the server starts at, when it checks the logs a first time: the cron then checks them
 * at each minute after it.
 */
const SERVER_START = new Date('2026-04-28T10:00:30.000Z')
const PREVIOUS_CHECK = new Date('2026-04-28T09:30:00.000Z')
const FIRST_SCHEDULED_CHECK = new Date('2026-04-28T10:01:00.000Z')

const ONE_MINUTE_MILLISECONDS = 60 * 1000

const logsNotifierSettings = getMockLogsNotifierSettings({
  config: getMockLogsNotifierConfig({ schedule: '* * * * *' })
})
const notificationSettings = getMockNotificationSettings()

const logFilePath = '/logs/server/billing/logs/send_invoices.jsonl'
const { telegramBaseUrl, telegramBotToken } = notificationSettings
const telegramUrl = `${telegramBaseUrl}/bot${telegramBotToken}/sendMessage`

const toLastCheckFileContent = (lastCheck: Date): string =>
  JSON.stringify({ lastCheck: lastCheck.toISOString() }, null, 2)

/**
 * A log file with a watched log before the previous check, and two logs after it, one of them
 * watched.
 */
const logFileContent = toJsonLinesFileContent([
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

/** Builds the server with the logs notifier, and makes it ready, as starting it does. */
const buildServerWithLogsNotifier = async (
  files: Record<string, string>,
  settings: Partial<Settings> = {}
): Promise<TestServer> => {
  const testServer = await buildTestServer({
    settings: {
      logs: getMockLogsSettings({ logsNotifier: logsNotifierSettings }),
      notification: notificationSettings,
      ...settings
    },
    files
  })
  await testServer.server.ready()
  return testServer
}

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

describe('logsNotifier', () => {
  test('Should notify every watched log when the server starts, and save its date', async () => {
    const { fileSystem } = await buildServerWithLogsNotifier({ [logFilePath]: logFileContent })

    await vi.waitFor(() => {
      expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
        toLastCheckFileContent(SERVER_START)
      )
    })

    const oldestWatchedLogMessage = 'Invoices not sent.'
    const [sentMessage] = getSentMessages()

    expect(sentMessage).toContain(oldestWatchedLogMessage)
  })

  test('Should notify the watched logs logged since the previous check, once', async () => {
    const { fileSystem } = await buildServerWithLogsNotifier({
      [logFilePath]: logFileContent,
      [logsNotifierSettings.lastLogsCheckFilePath]: toLastCheckFileContent(PREVIOUS_CHECK)
    })

    await vi.waitFor(() => {
      expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
        toLastCheckFileContent(SERVER_START)
      )
    })

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining(`"chat_id":"${notificationSettings.telegramChatId}"`),
      signal: expect.any(AbortSignal)
    })
    expect(getSentMessages()).toMatchSnapshot()

    await vi.advanceTimersByTimeAsync(ONE_MINUTE_MILLISECONDS)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
      toLastCheckFileContent(FIRST_SCHEDULED_CHECK)
    )
  })

  test('Should notify the same logs at the next check when the notification could not be sent', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    const { fileSystem } = await buildServerWithLogsNotifier({
      [logFilePath]: logFileContent,
      [logsNotifierSettings.lastLogsCheckFilePath]: toLastCheckFileContent(PREVIOUS_CHECK)
    })

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce()
    })

    expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
      toLastCheckFileContent(PREVIOUS_CHECK)
    )

    await vi.advanceTimersByTimeAsync(ONE_MINUTE_MILLISECONDS)

    const [firstMessage, secondMessage] = getSentMessages()
    expect(secondMessage).toBe(firstMessage)
    expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
      toLastCheckFileContent(FIRST_SCHEDULED_CHECK)
    )
  })

  test('Should read its schedule in the timezone of its config', async () => {
    const noonInTimezoneSchedule = '1 12 * * *'

    const { fileSystem } = await buildServerWithLogsNotifier(
      {},
      {
        logs: getMockLogsSettings({
          logsNotifier: getMockLogsNotifierSettings({
            config: getMockLogsNotifierConfig({
              schedule: noonInTimezoneSchedule,
              timezone: '+02:00'
            })
          })
        })
      }
    )

    await vi.waitFor(() => {
      expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
        toLastCheckFileContent(SERVER_START)
      )
    })
    fileSystem.setFile(
      logFilePath,
      toJsonLinesFileContent([
        {
          jobId: 13,
          timestamp: '2026-04-28T10:00:45.000Z',
          level: 'ERROR',
          message: 'Invoice 42 not sent.'
        }
      ])
    )
    await vi.advanceTimersByTimeAsync(ONE_MINUTE_MILLISECONDS)

    expect(getSentMessages()).toEqual([expect.stringContaining('2026-04-28 12:00:45 UTC+2')])
  })

  test('Should save a self report for each notification that is too long for the channel', async () => {
    const selfReportsSettings = getMockNotificationsSelfReportsSettings()
    const selfReportsFilePath = `${selfReportsSettings.dirPath}/${selfReportsSettings.fileName}`

    const { fileSystem } = await buildServerWithLogsNotifier(
      {
        [logFilePath]: logFileContent,
        [logsNotifierSettings.lastLogsCheckFilePath]: toLastCheckFileContent(PREVIOUS_CHECK)
      },
      {
        notification: getMockNotificationSettings({ telegramMessageSizeLimit: 10 }),
        notificationsSelfReports: selfReportsSettings
      }
    )

    await vi.advanceTimersByTimeAsync(ONE_MINUTE_MILLISECONDS)

    const notSentSelfReport = {
      level: 'ERROR',
      message:
        'The notification was not sent: The message telling about the watched logs cannot be built: its size limit of 10 characters is too small for any message',
      origin: 'notificationsTelegramService'
    }

    expect(fetchMock).not.toHaveBeenCalled()
    expect(fileSystem.getFile(selfReportsFilePath)).toBe(
      toJsonLinesFileContent([
        { sessionId: 1, date: SERVER_START.toISOString(), ...notSentSelfReport },
        { sessionId: 1, date: FIRST_SCHEDULED_CHECK.toISOString(), ...notSentSelfReport }
      ])
    )
    expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
      toLastCheckFileContent(PREVIOUS_CHECK)
    )
  })

  test('Should let the check end when the server closes', async () => {
    let answerTelegram: (response: Response) => void = () => undefined
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        answerTelegram = resolve
      })
    )
    const { server, fileSystem } = await buildServerWithLogsNotifier({
      [logFilePath]: logFileContent
    })

    await vi.advanceTimersByTimeAsync(ONE_MINUTE_MILLISECONDS)

    expect(fetchMock).toHaveBeenCalledOnce()

    let isServerClosed = false
    const closing = server.close().then(() => {
      isServerClosed = true
    })
    await vi.advanceTimersByTimeAsync(1000)

    expect(isServerClosed).toBe(false)

    answerTelegram(new Response('{}', { status: 200 }))
    await closing

    expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
      toLastCheckFileContent(SERVER_START)
    )

    await vi.advanceTimersByTimeAsync(ONE_MINUTE_MILLISECONDS)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fileSystem.getFile(logsNotifierSettings.lastLogsCheckFilePath)).toBe(
      toLastCheckFileContent(SERVER_START)
    )
  })
})
