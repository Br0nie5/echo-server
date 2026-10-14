import type { Log } from '@echo/utilities'
import { act, cleanup, waitFor, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import nock from 'nock'

import { mockConfig } from '../../../../test/mocks/mockConfig'
import { stubFilterWorker } from '../../../../test/mocks/stubFilterWorker'
import { renderFakeRouterApp, renderRealRouterApp } from '../../../../test/renderApp'
import { appTranslation } from '../../../../test/utils/appTranslation'
import { expectDateToBeSelected, getDateSection } from '../../../../test/utils/dateSelector'
import { getAppPath } from '../../../../test/utils/getAppPath'
import { getRouteTestId } from '../../../../test/utils/getRouteTestId'
import { resizeWindow } from '../../../../test/utils/resizeWindow'

import { logsMock } from './logs.mock'

/** The instant the tests run at: the day of the newest logs of `logsMock`. */
const NOW = new Date('2026-04-28T10:00:00.000Z')
const TODAY = '2026-04-28T00:00:00.000Z'
const YESTERDAY = '2026-04-27T00:00:00.000Z'
/** Where the logs start by default: `LOGS_INITIAL_DATE_DAYS_AGO` days before `NOW`. */
const TWO_DAYS_AGO = '2026-04-26T00:00:00.000Z'
const TWO_DAYS_AGO_TITLE = 'Sunday, 26 April 2026'

const mockLogsRequest = (fromDate: string): nock.Interceptor =>
  nock(mockConfig.API_URL).get('/logs').query({ fromDate })

const getLogsFrom = (fromDate: string): Log[] => logsMock.filter((log) => log.date >= fromDate)

/** The path of the logs screen with `query`, its query params in the order the screen writes them. */
const getLogsPath = (query: string[][]): string => `/logs?${new URLSearchParams(query)}`

/**
 * Opens the logs screen at `path`, on the logs of the last days, and waits for them to be
 * displayed and filtered.
 *
 * `messageToWaitFor` is the message of one of the logs the screen displays at `path`. Only the logs
 * screen is real, unless `isRealRouter` is true.
 */
const renderLogsScreen = async (
  path: string,
  { messageToWaitFor, isRealRouter = false }: { messageToWaitFor: string; isRealRouter?: boolean }
): Promise<RenderResult> => {
  mockLogsRequest(TWO_DAYS_AGO).reply(200, logsMock)

  const screen = isRealRouter ? renderRealRouterApp(path) : renderFakeRouterApp(path)

  await screen.findByText(messageToWaitFor)

  // The logs are first displayed all, under a progress bar, while they are being filtered: the
  // bar goes once the screen only displays the ones matching the filters.
  await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument())

  return screen
}

beforeEach(() => {
  // Only the date is set, and it goes on from there: the timers of the app are the real ones, and
  // the debounce of the filters measures the time that passes with the date.
  vi.useFakeTimers({ now: NOW, toFake: ['Date'], shouldAdvanceTime: true })
  stubFilterWorker()
  resizeWindow(1200, 600)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  cleanup()
})

describe('LogsScreen', () => {
  describe('Displaying the logs', () => {
    test('Should display the logs of the last days', async () => {
      const todayLogMessage = 'Invoices sent.'

      const screen = await renderLogsScreen('/logs', {
        messageToWaitFor: todayLogMessage,
        isRealRouter: true
      })

      expect(screen.asFragment()).toMatchSnapshot('wide screen')

      act(() => resizeWindow(600, 1200))

      expect(screen.asFragment()).toMatchSnapshot('phone screen')
    })
  })

  describe('Filtering the logs', () => {
    test('Should filter the logs by the levels', async () => {
      const user = userEvent.setup()

      const warningTestLogMessage = 'Stock file is older than a day.'
      const errorTestLogMessage = 'Stock could not be read.'
      const infoTestLogMessage = 'Invoices sent.'

      const screen = await renderLogsScreen('/logs?logLevels=WARNING', {
        messageToWaitFor: warningTestLogMessage
      })

      expect(screen.queryByText(infoTestLogMessage)).not.toBeInTheDocument()
      expect(screen.queryByText(errorTestLogMessage)).not.toBeInTheDocument()

      await user.click(screen.getByText('ERROR'))

      expect(await screen.findByText(errorTestLogMessage)).toBeInTheDocument()

      expect(screen.getByText(warningTestLogMessage)).toBeInTheDocument()
      expect(screen.queryByText(infoTestLogMessage)).not.toBeInTheDocument()

      await user.click(screen.getByText('WARNING'))

      await waitFor(() => expect(screen.queryByText(warningTestLogMessage)).not.toBeInTheDocument())

      expect(screen.getByText(errorTestLogMessage)).toBeInTheDocument()
      expect(getAppPath()).toBe(
        getLogsPath([
          ['fromDate', TWO_DAYS_AGO],
          ['logLevels', 'ERROR']
        ])
      )
    })

    test('Should filter the logs by the search', async () => {
      const user = userEvent.setup()

      const shopGroupSearch = 'groupName:shop'
      const withoutCouldNotSearch = '-message:"could not"'

      const shopGroupTestLogMessage = 'Stock file is older than a day.'
      const shopGroupCouldNotTestLogMessage = 'Stock could not be read.'
      const billingGroupTestLogMessage = 'Invoices sent.'
      const noGroupTestLogMessage = 'Ping answered.'

      const screen = await renderLogsScreen(`/logs?logSearch=${shopGroupSearch}`, {
        messageToWaitFor: shopGroupTestLogMessage
      })

      expect(screen.queryByText(billingGroupTestLogMessage)).not.toBeInTheDocument()
      expect(screen.queryByText(noGroupTestLogMessage)).not.toBeInTheDocument()
      expect(screen.getByText(shopGroupCouldNotTestLogMessage)).toBeInTheDocument()

      await user.type(screen.getByDisplayValue(shopGroupSearch), ` ${withoutCouldNotSearch}`)
      await user.keyboard('{Enter}')

      await waitFor(() =>
        expect(screen.queryByText(shopGroupCouldNotTestLogMessage)).not.toBeInTheDocument()
      )

      expect(screen.getByText(shopGroupTestLogMessage)).toBeInTheDocument()

      expect(getAppPath()).toBe(
        getLogsPath([
          ['fromDate', TWO_DAYS_AGO],
          ['logSearch', `${shopGroupSearch} ${withoutCouldNotSearch}`]
        ])
      )
    })

    test('Should filter the logs by the date', async () => {
      const user = userEvent.setup()

      const todayTestLogMessage = 'Invoices sent.'

      mockLogsRequest(YESTERDAY).reply(200, getLogsFrom(YESTERDAY))

      const screen = renderFakeRouterApp(getLogsPath([['fromDate', YESTERDAY]]))

      expect(await screen.findByText(todayTestLogMessage)).toBeInTheDocument()

      expectDateToBeSelected(screen, new Date(YESTERDAY))

      expect(screen.getByText(appTranslation('utils.yesterday'))).toBeInTheDocument()
      expect(screen.queryByText(TWO_DAYS_AGO_TITLE)).not.toBeInTheDocument()

      mockLogsRequest(TODAY).reply(200, [])

      await user.click(getDateSection(screen, 'Day'))
      await user.keyboard('{ArrowUp}')

      expect(await screen.findByText(appTranslation('query.noData'))).toBeInTheDocument()

      expectDateToBeSelected(screen, new Date(TODAY))
      expect(getAppPath()).toBe(getLogsPath([['fromDate', TODAY]]))

      expect(screen.queryByText(todayTestLogMessage)).not.toBeInTheDocument()
      expect(screen.queryByText(appTranslation('utils.yesterday'))).not.toBeInTheDocument()
    })
  })

  describe('Opening and hiding the logs', () => {
    test('Should only open the newest day, and let the user open and close the days', async () => {
      const user = userEvent.setup()

      const todayLogMessage = 'Invoices sent.'
      const otherTodayLogMessage = 'Ping answered.'
      const yesterdayLogMessage = 'Nothing to send.'

      const screen = await renderLogsScreen('/logs', { messageToWaitFor: todayLogMessage })

      expect(screen.queryByText(yesterdayLogMessage)).not.toBeInTheDocument()

      await user.click(screen.getByText(appTranslation('utils.yesterday')))

      expect(screen.getByText(yesterdayLogMessage)).toBeInTheDocument()

      await user.click(screen.getByText(appTranslation('utils.today')))

      expect(screen.queryByText(todayLogMessage)).not.toBeInTheDocument()
      expect(screen.queryByText(otherTodayLogMessage)).not.toBeInTheDocument()

      expect(screen.getByText(yesterdayLogMessage)).toBeInTheDocument()
    })

    test('Should let the user close a group, and open it again', async () => {
      const user = userEvent.setup()

      const billingGroupName = 'billing'
      const billingGroupJobTitle = '[send_invoices] > [12]'
      const billingGroupLogMessage = 'Invoices sent.'
      const shopGroupLogMessage = 'Stock could not be read.'
      const noGroupLogMessage = 'Ping answered.'

      const screen = await renderLogsScreen('/logs', { messageToWaitFor: billingGroupLogMessage })

      await user.click(screen.getByText(billingGroupName))

      expect(screen.queryByText(billingGroupLogMessage)).not.toBeInTheDocument()
      expect(screen.queryByText(billingGroupJobTitle)).not.toBeInTheDocument()

      expect(screen.getByText(shopGroupLogMessage)).toBeInTheDocument()
      expect(screen.getByText(noGroupLogMessage)).toBeInTheDocument()

      await user.click(screen.getByText(billingGroupName))

      expect(screen.getByText(billingGroupLogMessage)).toBeInTheDocument()
    })

    test('Should let the user close a job, and open it again', async () => {
      const user = userEvent.setup()

      const syncStockJobTitle = '[sync_stock] > [7]'
      const syncStockJobLogMessage = 'Stock could not be read.'
      const otherSyncStockJobLogMessage = 'Stock file is older than a day.'
      const sendInvoicesJobLogMessage = 'Invoices sent.'
      const pingJobLogMessage = 'Ping answered.'

      const screen = await renderLogsScreen('/logs', { messageToWaitFor: syncStockJobLogMessage })

      await user.click(screen.getByText(syncStockJobTitle))

      expect(screen.queryByText(syncStockJobLogMessage)).not.toBeInTheDocument()
      expect(screen.queryByText(otherSyncStockJobLogMessage)).not.toBeInTheDocument()

      expect(screen.getByText(sendInvoicesJobLogMessage)).toBeInTheDocument()
      expect(screen.getByText(pingJobLogMessage)).toBeInTheDocument()

      await user.click(screen.getByText(syncStockJobTitle))

      expect(screen.getByText(syncStockJobLogMessage)).toBeInTheDocument()
    })
  })

  describe('Error cases', () => {
    test('Should let the user try to fetch the logs again after an error', async () => {
      const user = userEvent.setup()

      const todayLogMessage = 'Invoices sent.'

      mockLogsRequest(TWO_DAYS_AGO).reply(500, { statusCode: 500, message: 'Some error.' })

      const screen = renderFakeRouterApp('/logs')

      expect(await screen.findByText(appTranslation('query.error'))).toBeInTheDocument()

      mockLogsRequest(TWO_DAYS_AGO).reply(200, logsMock)

      await user.click(screen.getByText(appTranslation('query.refetchButton')))

      expect(await screen.findByText(todayLogMessage)).toBeInTheDocument()
    })

    test('Should send an unauthenticated user to the auth screen', async () => {
      const logsPath = getLogsPath([
        ['fromDate', TWO_DAYS_AGO],
        ['logSearch', 'stock']
      ])
      mockLogsRequest(TWO_DAYS_AGO).reply(401, { statusCode: 401, message: 'Unauthorized.' })

      const screen = renderFakeRouterApp(logsPath)

      expect(
        await screen.findByTestId(
          getRouteTestId(`/auth?${new URLSearchParams({ redirect: logsPath })}`)
        )
      ).toBeInTheDocument()
    })
  })
})
