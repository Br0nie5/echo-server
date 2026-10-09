import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../modules/selfReport/infra/fileSessionJobId.api.js')
vi.mock('../../../modules/selfReport/infra/noopSelfReport.repository.js')
vi.mock('../../../modules/selfReport/infra/selfLogReport.repository.js')

import type { LogsRepository } from '../../../modules/logs/domain/logs.repository.js'
import type { SelfReportRepository } from '../../../modules/selfReport/domain/selfReport.repository.js'
import {
  createFileSessionJobIdApi as actualCreateFileSessionJobIdApi,
  type SessionJobIdApi
} from '../../../modules/selfReport/infra/fileSessionJobId.api.js'
import { createNoopSelfReportRepository as actualCreateNoopSelfReportRepository } from '../../../modules/selfReport/infra/noopSelfReport.repository.js'
import { createSelfLogReportRepository as actualCreateSelfLogReportRepository } from '../../../modules/selfReport/infra/selfLogReport.repository.js'
import { getMockSelfReportsConfig } from '../../../test/mocks/configs.js'
import { getSelfReportRepository } from '../getSelfReportRepository.js'

const createFileSessionJobIdApi = vi.mocked(actualCreateFileSessionJobIdApi)
const createNoopSelfReportRepository = vi.mocked(actualCreateNoopSelfReportRepository)
const createSelfLogReportRepository = vi.mocked(actualCreateSelfLogReportRepository)

const server = Fastify()
const logsRepository: LogsRepository = {
  getAllLogs: vi.fn(),
  getLogs: vi.fn(),
  saveLogs: vi.fn(),
  deleteLogs: vi.fn()
}
const sessionJobIdApi = {} as SessionJobIdApi
const selfLogReportRepository: SelfReportRepository = { saveSelfReports: vi.fn() }
const noopSelfReportRepository: SelfReportRepository = { saveSelfReports: vi.fn() }

describe('getSelfReportRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createFileSessionJobIdApi.mockReturnValue(sessionJobIdApi)
    createSelfLogReportRepository.mockResolvedValue(selfLogReportRepository)
    createNoopSelfReportRepository.mockReturnValue(noopSelfReportRepository)
  })

  it('should give the repository storing at the picked file of the self-reports directory when there is a self reports config', async () => {
    const selfReportsConfig = getMockSelfReportsConfig({
      selfReportsDirPath: '/server_logs/self_reports/Echo/log',
      parseLogFileSelfReportFileName: 'parseLogFile.jsonl'
    })

    const selfReportRepository = await getSelfReportRepository(
      server,
      logsRepository,
      selfReportsConfig,
      ({ parseLogFileSelfReportFileName }) => parseLogFileSelfReportFileName
    )

    expect(selfReportRepository).toBe(selfLogReportRepository)
    expect(createFileSessionJobIdApi).toHaveBeenCalledWith(selfReportsConfig)
    expect(createSelfLogReportRepository).toHaveBeenCalledWith({
      logsRepository,
      sessionJobIdApi,
      selfReportsConfig,
      selfReportsLocation: '/server_logs/self_reports/Echo/log/parseLogFile.jsonl',
      selfReportsLocationName: 'parseLogFile',
      logger: server.log
    })
  })

  it('should give a repository storing nothing when there is no self reports config', async () => {
    const selfReportRepository = await getSelfReportRepository(
      server,
      logsRepository,
      undefined,
      ({ parseLogFileSelfReportFileName }) => parseLogFileSelfReportFileName
    )

    expect(selfReportRepository).toBe(noopSelfReportRepository)
    expect(createSelfLogReportRepository).not.toHaveBeenCalled()
  })
})
