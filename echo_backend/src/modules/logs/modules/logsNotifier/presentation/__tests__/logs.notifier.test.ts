import type { FastifyInstance } from 'fastify'
import type { ScheduledTask } from 'node-cron'
import cron from 'node-cron'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node-cron')
vi.mock('../../application/checkProblemLogsAndNotify.js')

import { getMockLogsNotifierConfig } from '../../../../../../test/mocks/configs.js'
import { checkProblemLogsAndNotify as actualCheckProblemLogsAndNotify } from '../../application/checkProblemLogsAndNotify.js'
import logsNotifierPlugin, { type LogsNotifierPluginOptions } from '../logs.notifier.js'

const checkProblemLogsAndNotify = vi.mocked(actualCheckProblemLogsAndNotify)
const logsNotifierConfig = getMockLogsNotifierConfig()

const pluginOptions: LogsNotifierPluginOptions = {
  logsNotifierConfig,
  logsRepository: { getAllLogs: vi.fn(), getLogs: vi.fn(), saveLogs: vi.fn(), deleteLogs: vi.fn() },
  logsSelfReportRepository: { saveSelfReports: vi.fn() },
  notifier: { getMessageSizeLimit: vi.fn(), notify: vi.fn() },
  checkDateRepository: { getLastCheckDate: vi.fn(), saveLastCheckDate: vi.fn() },
  selfReportRepository: { saveSelfReports: vi.fn() }
}

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

/** Registers the plugin on `fastify` and returns the callback it scheduled. */
const registerAndGetCronCallback = async (
  fastify: FastifyInstance
): Promise<() => Promise<void>> => {
  vi.mocked(cron.schedule).mockReturnValueOnce({ stop: vi.fn() } as unknown as ScheduledTask)

  await logsNotifierPlugin(fastify, pluginOptions)

  return vi.mocked(cron.schedule).mock.calls[0][1] as () => Promise<void>
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('logsNotifier plugin', () => {
  it('should register the cron task and onClose hook when it is configured', async () => {
    const stopMock = vi.fn()
    vi.mocked(cron.schedule).mockReturnValueOnce({
      stop: stopMock
    } as unknown as ScheduledTask)

    const fastify = mockFastify()
    await logsNotifierPlugin(fastify, pluginOptions)

    expect(fastify.log.info).toHaveBeenCalledWith('Registering logs notifier')
    expect(cron.schedule).toHaveBeenCalledWith(logsNotifierConfig.schedule, expect.any(Function))
    expect(fastify.addHook).toHaveBeenCalledWith('onClose', expect.any(Function))

    // Simulate Fastify calling the onClose hook
    const onCloseCallback = vi.mocked(fastify.addHook).mock.calls[0][1] as () => Promise<void>
    await onCloseCallback()
    expect(stopMock).toHaveBeenCalledTimes(1)
  })

  it('should check the problem logs of the watched categories at each run', async () => {
    const fastify = mockFastify()
    const cronCallback = await registerAndGetCronCallback(fastify)

    await cronCallback()

    expect(checkProblemLogsAndNotify).toHaveBeenCalledWith({
      watchedLogsCategories: logsNotifierConfig.watchedLogsCategories,
      serverName: logsNotifierConfig.serverName,
      timezone: logsNotifierConfig.notifierTimezone,
      logsRepository: pluginOptions.logsRepository,
      logsSelfReportRepository: pluginOptions.logsSelfReportRepository,
      notifier: pluginOptions.notifier,
      checkDateRepository: pluginOptions.checkDateRepository,
      selfReportRepository: pluginOptions.selfReportRepository
    })
    expect(fastify.log.error).not.toHaveBeenCalled()
  })

  it('should log an error when a run throws', async () => {
    checkProblemLogsAndNotify.mockRejectedValueOnce(new Error('DB down'))

    const fastify = mockFastify()
    const cronCallback = await registerAndGetCronCallback(fastify)

    await cronCallback()

    expect(fastify.log.error).toHaveBeenCalledWith({ err: expect.any(Error) }, 'Cron job failed')
  })
})
