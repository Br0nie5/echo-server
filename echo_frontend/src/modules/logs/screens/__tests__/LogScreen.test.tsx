import { LogCategory, type GetLogsParams, type Log, type LogSearchFilter } from '@echo/utilities'
import { waitForElementToBeRemoved, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Scope, Interceptor } from 'nock'
import nock from 'nock'
import { vi, vitest, type Mock } from 'vitest'

import i18n from '../../../../shared/i18n/i18n'
import type { AppTranslation } from '../../../../shared/i18n/useAppTranslation'
import { AppPathNames } from '../../../../shared/navigation/pathNames'
import { formatDate } from '../../../../shared/utils/formatDate'
import { renderApp } from '../../../../test/renderApp'
import { testEnv } from '../../../../test/utils/env'
import { resizeWindow } from '../../../../test/utils/resizeWindow'
import { testUrl } from '../../../../test/utils/url'
import { getGetLogsQueryKey } from '../../infra/getLogsQueryKey'
import { LogsScreen } from '../LogsScreen'
import { getLogsInitialDate } from '../utils/getLogsDates'

import { getLogsMock } from './logs.mock'

vi.mock('../../infra/__workers__/filterLogs.ts', async () => {
  const { filterLogByCategories, filterLogBySearch } = await vi.importActual<{
    filterLogByCategories: (log: Log, categories: LogCategory[]) => boolean
    filterLogBySearch: (log: Log, searchFilters: LogSearchFilter[]) => boolean
  }>('@echo/utilities')

  return {
    filterLogs: vi.fn(
      (logs: Log[], logCategoriesFilters: LogCategory[], logSearchFilters: LogSearchFilter[]) => {
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                logs
                  .filter((log) => filterLogByCategories(log, logCategoriesFilters))
                  .filter((log) => filterLogBySearch(log, logSearchFilters))
              ),
            100
          )
        )
      }
    )
  }
})

vi.mock('use-debounce', () => {
  return {
    useDebounce: (value: unknown): unknown[] => [value]
  }
})

const mockTodayDate = new Date('2026-04-28T10:00:00.000Z')

vitest.setSystemTime(mockTodayDate)

const logsMock = getLogsMock(mockTodayDate)

const appTranslation: AppTranslation = (key) => i18n.t(key)

let mockSetHref: Mock

beforeAll(() => {
  mockSetHref = vi.fn()
  const originalLocation = window.location

  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...originalLocation, href: originalLocation.href }
  })
  Object.defineProperty(window.location, 'href', {
    set: mockSetHref,
    get: () => originalLocation.href,
    configurable: true
  })
})

beforeEach(() => {
  vi.clearAllMocks()

  vi.resetModules()
})

const buildRequestMockScope = (): Scope => {
  return nock(testEnv.API_URL)
}

const buildLogsRequestMock = (params: GetLogsParams): Interceptor => {
  const logsUri = getGetLogsQueryKey(params)[0]

  return buildRequestMockScope().get(logsUri).query(params)
}

const buildLogsSuccessRequestMock = (params: GetLogsParams): void => {
  const logsFilteredByParams = logsMock.filter(
    (log) => new Date(log.date).getTime() > new Date(params.fromDate).getTime()
  )
  buildLogsRequestMock(params).reply(200, logsFilteredByParams)
}

const buildLogsErrorRequestMock = (params: GetLogsParams, statusCode: number = 400): void => {
  buildLogsRequestMock(params).reply(statusCode, { statusCode, message: 'random error' })
}

type RenderLogsScreenMode = { status: 'success' } | { status: 'error'; statusCode?: number }
type RenderLogsScreenParams = { pathname?: string; logsInitialDateOverride?: string }

const renderLogsScreen = async (
  mode: RenderLogsScreenMode,
  params?: RenderLogsScreenParams
): Promise<RenderResult> => {
  const fromDate = params?.logsInitialDateOverride ?? getLogsInitialDate()

  let textToFind: string

  switch (mode.status) {
    case 'success':
      textToFind = logsMock[0].message
      buildLogsSuccessRequestMock({ fromDate })
      break
    case 'error':
      textToFind = appTranslation('query.error')
      buildLogsErrorRequestMock({ fromDate }, mode.statusCode)
      break
  }

  const screen = await renderApp(AppPathNames.logs, <LogsScreen />, params?.pathname)

  await screen.findAllByText(textToFind)

  return screen
}

describe('LogsScreen', () => {
  test('Should render all the logs on a big screen', async () => {
    resizeWindow(1200, 600)

    const screen = await renderLogsScreen({ status: 'success' })

    expect(screen.asFragment()).toMatchSnapshot()
  })

  test('Should render all the logs on a small screen', async () => {
    resizeWindow(600, 1200)

    const screen = await renderLogsScreen({ status: 'success' })

    expect(screen.asFragment()).toMatchSnapshot()
  })

  describe('Filters', () => {
    describe('From query parameters', () => {
      test('Should directly filter all logs unrelated to the wanted category if it is present as a query parameter', async () => {
        const screen = await renderLogsScreen(
          { status: 'success' },
          { pathname: '?logCategories=WARNING' }
        )

        await waitForElementToBeRemoved(screen.getAllByText(logsMock[0].message))

        const warningLog = logsMock.find((log) => log.category === LogCategory.WARNING)
        expect(warningLog).not.toBeUndefined()

        screen.getByText(warningLog!.message)

        expect(warningLog).not.toBeNull()
        expect(screen.queryAllByText(/SUCCESS/i).length).toBe(1)
        expect(screen.queryAllByText(/INFO/i).length).toBe(1)
        expect(screen.queryAllByText(/WARNING/i).length).toBeGreaterThan(1)
        expect(screen.queryAllByText(/ERROR/i).length).toBe(1)
      })

      test('Should directly filter all logs unrelated to the search query if it is present as a query parameter', async () => {
        const filterLog = logsMock[15]

        const filterLogSearchQuery =
          `jobId:${filterLog.jobId} ` +
          `fileName:${filterLog.fileName} ` +
          `groupName:${filterLog.groupName} ` +
          `message:${filterLog.message}`

        const screen = await renderLogsScreen(
          { status: 'success' },
          {
            pathname: `?logSearch=${filterLogSearchQuery}`
          }
        )

        await waitForElementToBeRemoved(screen.getAllByText(logsMock[1].message))
        expect(screen.queryByText(logsMock[5].message)).not.toBeInTheDocument()
        expect(screen.queryByText(logsMock[20].message)).not.toBeInTheDocument()

        expect(screen.queryByText(filterLog.message)).toBeInTheDocument()
      })

      test('Should directly filter all the logs older that fromDate if it is present as a query parameter', async () => {
        const lastLogsSeenDate = new Date(getLogsInitialDate())

        const newLogsFromDate = new Date(lastLogsSeenDate.getTime() + 1 * 24 * 60 * 60 * 1000)

        const screen = await renderLogsScreen(
          { status: 'success' },
          {
            pathname: `?fromDate=${newLogsFromDate.toISOString()}`,
            logsInitialDateOverride: newLogsFromDate.toISOString()
          }
        )

        expect(
          screen.queryByText(
            formatDate(lastLogsSeenDate, 'dayName day monthName year', appTranslation)
          )
        ).not.toBeInTheDocument()
      })
    })

    describe('From user interaction', () => {
      test('Should filter all logs unrelated to the wanted category', async () => {
        const user = userEvent.setup()

        const screen = await renderLogsScreen({ status: 'success' })

        const warnings = screen.getAllByText('WARNING')

        await user.click(warnings[0])

        await waitForElementToBeRemoved(screen.getAllByText(logsMock[0].message))

        const warningLog = logsMock.find((log) => log.category === LogCategory.WARNING)
        expect(warningLog).not.toBeNull()
        expect(screen.getByText(warningLog!.message)).toBeInTheDocument()
      })

      test('Should filter all logs unrelated to the search query', async () => {
        const user = userEvent.setup()

        const screen = await renderLogsScreen({ status: 'success' })

        const searchInput = screen.getByPlaceholderText(appTranslation('logs.searchPlaceholder'))

        const filterLog = logsMock[15]

        const filterLogSearchQuery =
          `jobId:${filterLog.jobId} ` +
          `fileName:${filterLog.fileName} ` +
          `groupName:${filterLog.groupName} ` +
          `message:${filterLog.message}`

        await user.type(searchInput, filterLogSearchQuery)
        await user.keyboard('{Enter}')

        await waitForElementToBeRemoved(screen.getAllByText(logsMock[1].message))
        expect(screen.queryByText(logsMock[5].message)).not.toBeInTheDocument()
        expect(screen.queryByText(logsMock[20].message)).not.toBeInTheDocument()

        expect(screen.queryByText(filterLog.message)).toBeInTheDocument()
      })

      test('Should filter out all logs unrelated to the search query', async () => {
        const user = userEvent.setup()

        const screen = await renderLogsScreen({ status: 'success' })

        const searchInput = screen.getByPlaceholderText(appTranslation('logs.searchPlaceholder'))

        const filterLog = logsMock[15]

        const filterLogSearchQuery = `-"${filterLog.message}"`

        await user.type(searchInput, filterLogSearchQuery)
        await user.keyboard('{Enter}')

        await waitForElementToBeRemoved(screen.getAllByText(filterLog.message))

        screen.getAllByText(logsMock[1].message)
        screen.getAllByText(logsMock[5].message)
        screen.getAllByText(logsMock[20].message)
      })

      test('Should filter the logs older than fromDate param when clicking on another date in the DatePicker', async () => {
        const user = userEvent.setup()

        const screen = await renderLogsScreen({ status: 'success' })

        const lastLogsSeenDate = new Date(getLogsInitialDate())

        expect(
          screen.getByText(
            formatDate(lastLogsSeenDate, 'dayName day monthName year', appTranslation)
          )
        ).toBeInTheDocument()

        const newLogsFromDate = new Date(lastLogsSeenDate.getTime() + 1 * 24 * 60 * 60 * 1000)

        buildLogsSuccessRequestMock({ fromDate: newLogsFromDate.toISOString() })

        await user.click(screen.getByLabelText(/Choose date/))

        const daySpinner = screen.getByRole('spinbutton', { name: 'Day' })
        await userEvent.click(daySpinner)
        await userEvent.keyboard('{ArrowUp}')

        await screen.findAllByText(logsMock[0].message)

        expect(
          screen.queryByText(
            formatDate(lastLogsSeenDate, 'dayName day monthName year', appTranslation)
          )
        ).not.toBeInTheDocument()
      })
    })
  })

  test('Should show logs when opening a day section', async () => {
    const user = userEvent.setup()

    const screen = await renderLogsScreen({ status: 'success' })

    const elements = screen.getAllByText(logsMock[0].message)
    expect(elements).toHaveLength(2)

    const yesterday = screen.getByText('Yesterday')

    await user.click(yesterday)

    const filteredElements = await screen.findAllByText(logsMock[0].message)
    expect(filteredElements).toHaveLength(3)
  })

  describe('Error cases', () => {
    test('Should refetch logs if clicking on refetch button on error page', async () => {
      const user = userEvent.setup()

      const screen = await renderLogsScreen({ status: 'error' })

      const refetchButton = screen.getByText(appTranslation('query.refetchButton'))

      buildLogsSuccessRequestMock({ fromDate: getLogsInitialDate() })

      await user.click(refetchButton)

      expect(mockSetHref).not.toHaveBeenCalled()

      await screen.findAllByText(logsMock[0].message)
    })

    test('Should reload windows when getting an error 401 (unauthorized)', async () => {
      await renderLogsScreen({ status: 'error', statusCode: 401 })

      expect(mockSetHref).toHaveBeenCalledWith(
        `${testEnv.APP_URL}${AppPathNames.auth}?redirect=${encodeURIComponent(testUrl).replace(/%20/g, '+')}`
      )
    })
  })
})
