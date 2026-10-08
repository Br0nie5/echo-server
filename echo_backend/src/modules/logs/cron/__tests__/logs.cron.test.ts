import type { Log, LogCategory } from '@echo/utilities'
import type { FastifyInstance } from 'fastify'
import type { ScheduledTask } from 'node-cron'
import cron from 'node-cron'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node-cron')
vi.mock('../../application/getFilteredLogs.js')

import type { CronConfig } from '../../../../shared/config/backConfig.js'
import { getMockCronConfig } from '../../../../test/mocks/configs.js'
import { getFilteredLogs as actualGetFilteredLogs } from '../../application/getFilteredLogs.js'
import logsCronPlugin, {
  checkProblemLogsAndNotify,
  getProblemLogs,
  type LogsCronPluginOptions
} from '../logs.cron.js'

function mockLog(overrides: Partial<Log> = {}): Log {
  return {
    id: 'log-1',
    jobId: 1,
    date: '2026-01-01T10:00:00.000Z',
    category: 'ERROR',
    fileName: 'worker',
    message: 'Something broke',
    callFile: 'worker.sh',
    callLine: 1,
    ...overrides
  }
}

const getFilteredLogs = vi.mocked(actualGetFilteredLogs)
const logsRepository = { findAllLogs: vi.fn() }
const notifier = { notify: vi.fn() }
const checkpointStore = { getLastCheckDate: vi.fn(), saveLastCheckDate: vi.fn() }
const WATCHED = ['ERROR', 'WARNING'] as LogCategory[]

const check = (): Promise<void> =>
  checkProblemLogsAndNotify({
    watchedLogsCategories: WATCHED,
    logsRepository,
    notifier,
    checkpointStore
  })

const pluginOptions = (cronConfig: CronConfig): LogsCronPluginOptions => ({
  cronConfig,
  logsRepository,
  notifier,
  checkpointStore
})

function mockFastify(): FastifyInstance {
  return {
    log: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    },
    addHook: vi.fn()
  } as unknown as FastifyInstance
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
describe('getProblemLogs', () => {
  it('should return the filtered logs of the repository when present', async () => {
    const logs = [mockLog()]
    getFilteredLogs.mockResolvedValueOnce(logs)

    const result = await getProblemLogs(logsRepository, new Date(), ['ERROR'])

    expect(result).toBe(logs)
    expect(getFilteredLogs).toHaveBeenCalledWith(logsRepository, {
      fromDate: expect.any(Date),
      categories: ['ERROR'],
      searchFilters: []
    })
  })

  it('should pass an empty result through', async () => {
    getFilteredLogs.mockResolvedValueOnce([])

    const result = await getProblemLogs(logsRepository, new Date(), ['ERROR'])

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
describe('checkProblemLogsAndNotify', () => {
  it('should save the date and skip checking/notifying on first run (no checkpoint)', async () => {
    checkpointStore.getLastCheckDate.mockResolvedValueOnce(undefined)

    await check()

    expect(getFilteredLogs).not.toHaveBeenCalled()
    expect(notifier.notify).not.toHaveBeenCalled()
    expect(checkpointStore.saveLastCheckDate).toHaveBeenCalledTimes(1)
  })

  it('should check for problem logs and notify when logs are found', async () => {
    const logs = [mockLog()]
    checkpointStore.getLastCheckDate.mockResolvedValueOnce(new Date('2026-01-01T00:00:00.000Z'))
    getFilteredLogs.mockResolvedValueOnce(logs)

    await check()

    expect(getFilteredLogs).toHaveBeenCalledWith(logsRepository, {
      fromDate: new Date('2026-01-01T00:00:00.000Z'),
      categories: WATCHED,
      searchFilters: []
    })
    expect(notifier.notify).toHaveBeenCalledWith(logs)
    expect(checkpointStore.saveLastCheckDate).toHaveBeenCalledTimes(1) // checkpoint advanced after send
  })

  it('should not notify when no problem logs are found', async () => {
    checkpointStore.getLastCheckDate.mockResolvedValueOnce(new Date('2026-01-01T00:00:00.000Z'))
    getFilteredLogs.mockResolvedValueOnce([])

    await check()

    expect(notifier.notify).not.toHaveBeenCalled()
    expect(checkpointStore.saveLastCheckDate).toHaveBeenCalledTimes(1) // checkpoint still advances
  })

  it('should not advance the checkpoint when notifying fails', async () => {
    checkpointStore.getLastCheckDate.mockResolvedValueOnce(new Date('2026-01-01T00:00:00.000Z'))
    getFilteredLogs.mockResolvedValueOnce([mockLog()])
    notifier.notify.mockRejectedValueOnce(new Error('Telegram down'))

    await expect(check()).rejects.toThrow('Telegram down')

    expect(checkpointStore.saveLastCheckDate).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
describe('logsCron plugin', () => {
  it('should register the cron task and onClose hook when it is configured', async () => {
    const cronConfig = getMockCronConfig()

    const stopMock = vi.fn()
    vi.mocked(cron.schedule).mockReturnValueOnce({
      stop: stopMock
    } as unknown as ScheduledTask)

    const fastify = mockFastify()
    await logsCronPlugin(fastify, pluginOptions(cronConfig))

    expect(fastify.log.info).toHaveBeenCalledWith('Registering logs cron')
    expect(cron.schedule).toHaveBeenCalledWith(cronConfig.schedule, expect.any(Function))
    expect(fastify.addHook).toHaveBeenCalledWith('onClose', expect.any(Function))

    // Simulate Fastify calling the onClose hook
    const onCloseCallback = vi.mocked(fastify.addHook).mock.calls[0][1] as () => Promise<void>
    await onCloseCallback()
    expect(stopMock).toHaveBeenCalledTimes(1)
  })

  it('should run the cron callback successfully without logging an error', async () => {
    const cronConfig = getMockCronConfig()

    vi.mocked(cron.schedule).mockReturnValueOnce({ stop: vi.fn() } as unknown as ScheduledTask)
    checkpointStore.getLastCheckDate.mockResolvedValueOnce(undefined) // first run path

    const fastify = mockFastify()
    await logsCronPlugin(fastify, pluginOptions(cronConfig))

    const cronCallback = vi.mocked(cron.schedule).mock.calls[0][1] as () => Promise<void>
    await cronCallback()

    expect(fastify.log.error).not.toHaveBeenCalled()
  })

  it('should log an error when the cron callback throws', async () => {
    const cronConfig = getMockCronConfig()

    vi.mocked(cron.schedule).mockReturnValueOnce({ stop: vi.fn() } as unknown as ScheduledTask)
    checkpointStore.getLastCheckDate.mockResolvedValueOnce(new Date('2026-01-01T00:00:00.000Z'))
    getFilteredLogs.mockRejectedValueOnce(new Error('DB down'))

    const fastify = mockFastify()
    await logsCronPlugin(fastify, pluginOptions(cronConfig))

    const cronCallback = vi.mocked(cron.schedule).mock.calls[0][1] as () => Promise<void>
    await cronCallback()

    expect(fastify.log.error).toHaveBeenCalledWith({ err: expect.any(Error) }, 'Cron job failed')
  })
})
