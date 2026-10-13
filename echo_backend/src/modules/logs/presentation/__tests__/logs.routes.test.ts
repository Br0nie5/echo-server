import type { Log } from '@echo/utilities'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

import { buildTestServer } from '../../../../test/buildTestServer.js'
import { getMockAuthConfig, getMockSelfReportsConfig } from '../../../../test/mocks/mockConfigs.js'

/** The instant the tests run at, which the lines that hold no log are reported at. */
const NOW = new Date('2026-04-28T10:00:00.000Z')

const sendInvoicesLogFilePath = '/logs/server/billing/logs/send_invoices.jsonl'
const pingLogFilePath = '/logs/ping.jsonl'

const toLogFileContent = (lines: object[]): string =>
  lines.map((line) => `${JSON.stringify(line)}\n`).join('')

/** Two log files: one of a script of the `billing` group, over two days, and one without group. */
const logFiles = {
  [sendInvoicesLogFilePath]: toLogFileContent([
    {
      jobId: 11,
      timestamp: '2026-04-27T09:40:00.000Z',
      level: 'INFO',
      message: 'Nothing to send.',
      origin: 'send_invoices.sh:12'
    },
    {
      jobId: 12,
      timestamp: '2026-04-28T09:42:01.000Z',
      level: 'WARNING',
      message: 'Invoice 41 sent on attempt 2.'
    },
    {
      jobId: 12,
      timestamp: '2026-04-28T09:42:09.000Z',
      level: 'INFO',
      message: 'Invoices sent.'
    }
  ]),
  [pingLogFilePath]: toLogFileContent([
    {
      jobId: 3,
      timestamp: '2026-04-28T07:00:00.000Z',
      level: 'ERROR',
      message: 'Ping not answered.'
    }
  ])
}

const getMessages = (logs: Log[]): string[] => logs.map((log) => log.message)

beforeAll(() => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] })
})

afterAll(() => {
  vi.useRealTimers()
})

describe('GET /logs', () => {
  test('Should answer the logs of every log file, from the newest to the oldest', async () => {
    const { server } = await buildTestServer({ config: { auth: undefined }, files: logFiles })

    const response = await server.inject({
      method: 'GET',
      url: '/api/logs',
      query: { fromDate: '2026-04-26T00:00:00.000Z' }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })

  describe('Filtering the logs', () => {
    test('Should only answer the logs of the period, its start included and its end left out', async () => {
      const yesterdayLogMessage = 'Nothing to send.'
      const todayMorningLogMessage = 'Ping not answered.'

      const { server } = await buildTestServer({ config: { auth: undefined }, files: logFiles })

      const fromDateResponse = await server.inject({
        method: 'GET',
        url: '/api/logs',
        query: { fromDate: '2026-04-28T00:00:00.000Z' }
      })

      expect(getMessages(fromDateResponse.json())).not.toContain(yesterdayLogMessage)
      expect(getMessages(fromDateResponse.json())).toHaveLength(3)

      const periodResponse = await server.inject({
        method: 'GET',
        url: '/api/logs',
        query: { fromDate: '2026-04-27T00:00:00.000Z', toDate: '2026-04-28T09:00:00.000Z' }
      })

      expect(getMessages(periodResponse.json())).toEqual([
        todayMorningLogMessage,
        yesterdayLogMessage
      ])

      const yesterdayLogDate = '2026-04-27T09:40:00.000Z'
      const todayMorningLogDate = '2026-04-28T07:00:00.000Z'

      const exactPeriodResponse = await server.inject({
        method: 'GET',
        url: '/api/logs',
        query: { fromDate: yesterdayLogDate, toDate: todayMorningLogDate }
      })

      expect(getMessages(exactPeriodResponse.json())).toEqual([yesterdayLogMessage])
    })

    test('Should only answer the logs of the levels', async () => {
      const warningLogMessage = 'Invoice 41 sent on attempt 2.'
      const errorLogMessage = 'Ping not answered.'

      const { server } = await buildTestServer({ config: { auth: undefined }, files: logFiles })

      const oneLevelResponse = await server.inject({
        method: 'GET',
        url: '/api/logs?fromDate=2026-04-26T00:00:00.000Z&logLevels=WARNING'
      })

      expect(getMessages(oneLevelResponse.json())).toEqual([warningLogMessage])

      const twoLevelsResponse = await server.inject({
        method: 'GET',
        url: '/api/logs?fromDate=2026-04-26T00:00:00.000Z&logLevels=WARNING&logLevels=ERROR'
      })

      expect(getMessages(twoLevelsResponse.json())).toEqual([warningLogMessage, errorLogMessage])
    })

    test('Should only answer the logs matching the search', async () => {
      const billingGroupLogMessage = 'Invoices sent.'
      const billingGroupWarningLogMessage = 'Invoice 41 sent on attempt 2.'

      const { server } = await buildTestServer({ config: { auth: undefined }, files: logFiles })

      const response = await server.inject({
        method: 'GET',
        url: '/api/logs',
        query: {
          fromDate: '2026-04-28T00:00:00.000Z',
          logSearch: 'groupName:billing -message:"attempt 2"'
        }
      })

      expect(getMessages(response.json())).toEqual([billingGroupLogMessage])
      expect(getMessages(response.json())).not.toContain(billingGroupWarningLogMessage)
    })

    test.each<{ reason: string; query: Record<string, string>; wrongField: string }>([
      { reason: 'without fromDate', query: {}, wrongField: 'fromDate' },
      {
        reason: 'with a fromDate that is not a date',
        query: { fromDate: 'yesterday' },
        wrongField: 'fromDate'
      },
      {
        reason: 'with a fromDate that is a date, but not an ISO one',
        query: { fromDate: '2026-04-26 00:00:00Z' },
        wrongField: 'fromDate'
      },
      {
        reason: 'with a level that is not one',
        query: { fromDate: '2026-04-26T00:00:00.000Z', logLevels: 'DEBUG' },
        wrongField: 'logLevels'
      }
    ])('Should refuse a query $reason, and name the field', async ({ query, wrongField }) => {
      const { server } = await buildTestServer({ config: { auth: undefined }, files: logFiles })

      const response = await server.inject({ method: 'GET', url: '/api/logs', query })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({
        statusCode: 400,
        message: expect.stringContaining(wrongField)
      })
    })
  })

  test('Should only answer a logged in user when the server has authentication', async () => {
    const { server, config } = await buildTestServer({
      config: { auth: getMockAuthConfig({ usersDbFilePath: ':memory:' }) },
      files: logFiles
    })
    const query = { fromDate: '2026-04-26T00:00:00.000Z' }

    const anonymousResponse = await server.inject({ method: 'GET', url: '/api/logs', query })

    expect(anonymousResponse.statusCode).toBe(401)
    expect(anonymousResponse.json()).toEqual({ statusCode: 401, message: 'Invalid token.' })

    const loggedInResponse = await server.inject({
      method: 'GET',
      url: '/api/logs',
      query,
      cookies: { [config.auth!.cookieName]: server.jwt.sign({ user: 'admin' }) }
    })

    expect(loggedInResponse.statusCode).toBe(200)
    expect(loggedInResponse.json()).toHaveLength(4)
  })

  test('Should save the lines that hold no log as self reports, and answer them as logs', async () => {
    const notALogLine = 'Invoices sent, but this line is no JSON.'
    const selfReportsConfig = getMockSelfReportsConfig()
    const { selfReportsDirPath, parseLogsSelfReportFileName } = selfReportsConfig
    const selfReportsFilePath = `${selfReportsDirPath}/${parseLogsSelfReportFileName}`

    const { server, fileSystem } = await buildTestServer({
      config: { auth: undefined, selfReports: selfReportsConfig },
      files: { [sendInvoicesLogFilePath]: `${notALogLine}\n` }
    })
    const query = { fromDate: '2026-04-26T00:00:00.000Z' }

    await server.inject({ method: 'GET', url: '/api/logs', query })
    const secondResponse = await server.inject({ method: 'GET', url: '/api/logs', query })

    expect(fileSystem.getFile(selfReportsFilePath)).toBe(
      toLogFileContent([
        {
          sessionId: 1,
          date: NOW.toISOString(),
          level: 'WARNING',
          message: notALogLine,
          origin: `${sendInvoicesLogFilePath}:1`
        }
      ])
    )
    expect(secondResponse.json()).toMatchObject([
      {
        groupName: 'self_reports_Echo',
        location: selfReportsFilePath,
        locationName: 'parseLogFile',
        jobId: 1,
        level: 'WARNING',
        message: notALogLine,
        origin: `${sendInvoicesLogFilePath}:1`
      }
    ])
  })
})
