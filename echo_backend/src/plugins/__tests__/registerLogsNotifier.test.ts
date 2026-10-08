import Fastify, { type FastifyInstance } from 'fastify'
import type { ScheduledTask } from 'node-cron'
import cron from 'node-cron'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node-cron')
vi.mock('../utils/getSelfReportRepository.js')

import type { LogsRepository } from '../../modules/logs/domain/logs.repository.js'
import type { LogsFilesApi } from '../../modules/logs/infra/logsFiles.api.js'
import type { LogsNotifierPluginOptions } from '../../modules/logs/modules/logsNotifier/presentation/logs.notifier.js'
import type { SelfReportRepository } from '../../modules/selfReport/domain/selfReport.repository.js'
import {
  getMockBackConfig,
  getMockLogsConfig,
  getMockLogsNotifierConfig,
  getMockNotificationConfig
} from '../../test/mocks/configs.js'
import { registerLogsNotifier } from '../registerLogsNotifier.js'
import { getSelfReportRepository as actualGetSelfReportRepository } from '../utils/getSelfReportRepository.js'

const getSelfReportRepository = vi.mocked(actualGetSelfReportRepository)

const logsFilesApi = {} as LogsFilesApi
const logsRepository: LogsRepository = { findAllLogs: vi.fn() }
const selfReportRepository: SelfReportRepository = { saveSelfReports: vi.fn() }
const logsNotifierConfig = getMockLogsNotifierConfig()
const notificationConfig = getMockNotificationConfig()

describe('registerLogsNotifier', () => {
  let server: FastifyInstance
  const stopCron = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cron.schedule).mockReturnValue({ stop: stopCron } as unknown as ScheduledTask)
    getSelfReportRepository.mockResolvedValue(selfReportRepository)
    server = Fastify()
    vi.spyOn(server.log, 'info')
  })

  afterEach(async () => {
    await server.close()
  })

  it('should schedule the cron and stop it when the server closes', async () => {
    await registerLogsNotifier(
      server,
      getMockBackConfig({
        logs: getMockLogsConfig({ logsNotifier: logsNotifierConfig }),
        notification: notificationConfig
      }),
      logsFilesApi,
      logsRepository
    )
    await server.close()

    expect(cron.schedule).toHaveBeenCalledWith(logsNotifierConfig.schedule, expect.any(Function))
    expect(stopCron).toHaveBeenCalledTimes(1)
  })

  it('should give the cron the logs repository and its own self-report repository', async () => {
    const register = vi.spyOn(server, 'register')
    const config = getMockBackConfig({
      logs: getMockLogsConfig({ logsNotifier: logsNotifierConfig }),
      notification: notificationConfig
    })

    await registerLogsNotifier(server, config, logsFilesApi, logsRepository)

    expect(getSelfReportRepository).toHaveBeenCalledWith(
      server,
      logsFilesApi,
      config.selfReports,
      config.selfReports.logsNotifierSelfReportFileName
    )
    const pluginOptions = register.mock.calls[0][1] as LogsNotifierPluginOptions
    expect(pluginOptions.logsNotifierConfig).toBe(logsNotifierConfig)
    expect(pluginOptions.logsRepository).toBe(logsRepository)
    expect(pluginOptions.selfReportRepository).toBe(selfReportRepository)
    expect(pluginOptions.notifier.getMessageSizeLimit()).toBe(
      notificationConfig.telegramMessageSizeLimit
    )
  })

  it('should register nothing when the logs notifier is not configured', async () => {
    await registerLogsNotifier(
      server,
      getMockBackConfig({ notification: notificationConfig }),
      logsFilesApi,
      logsRepository
    )

    expect(cron.schedule).not.toHaveBeenCalled()
    expect(getSelfReportRepository).not.toHaveBeenCalled()
    expect(server.log.info).toHaveBeenCalledWith(
      'The logs notifier is not configured, skipping its registration'
    )
  })

  it('should register nothing when the notifications are not configured', async () => {
    await registerLogsNotifier(
      server,
      getMockBackConfig({ logs: getMockLogsConfig({ logsNotifier: logsNotifierConfig }) }),
      logsFilesApi,
      logsRepository
    )

    expect(cron.schedule).not.toHaveBeenCalled()
    expect(getSelfReportRepository).not.toHaveBeenCalled()
    expect(server.log.info).toHaveBeenCalledWith(
      'The logs notifier is not configured, skipping its registration'
    )
  })
})
