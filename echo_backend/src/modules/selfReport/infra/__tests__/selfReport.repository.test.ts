import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../fileSessionJobId.api.js')
vi.mock('../noopSelfReport.repository.js')
vi.mock('../selfLogReport.repository.js')

import type { Logger } from '../../../../shared/types/logger.js'
import { getMockSelfReportsConfig } from '../../../../test/mocks/mockConfigs.js'
import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import type { LogsRepository } from '../../../logs/domain/logs.repository.js'
import type { SelfReportRepository } from '../../domain/selfReport.repository.js'
import {
  createFileSessionJobIdApi as actualCreateFileSessionJobIdApi,
  type SessionJobIdApi
} from '../fileSessionJobId.api.js'
import { createNoopSelfReportRepository as actualCreateNoopSelfReportRepository } from '../noopSelfReport.repository.js'
import { createSelfLogReportRepository as actualCreateSelfLogReportRepository } from '../selfLogReport.repository.js'
import { createSelfReportRepository } from '../selfReport.repository.js'

const createFileSessionJobIdApi = vi.mocked(actualCreateFileSessionJobIdApi)
const createNoopSelfReportRepository = vi.mocked(actualCreateNoopSelfReportRepository)
const createSelfLogReportRepository = vi.mocked(actualCreateSelfLogReportRepository)

const logger: Logger = { error: vi.fn() }
const logsRepository: LogsRepository = {
  getAllLogs: vi.fn(),
  getLogs: vi.fn(),
  saveLogs: vi.fn(),
  deleteLogs: vi.fn()
}
const filesService = getMockFilesService()
const sessionJobIdApi = {} as SessionJobIdApi
const selfLogReportRepository: SelfReportRepository = { saveSelfReports: vi.fn() }
const noopSelfReportRepository: SelfReportRepository = { saveSelfReports: vi.fn() }

describe('createSelfReportRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createFileSessionJobIdApi.mockReturnValue(sessionJobIdApi)
    createSelfLogReportRepository.mockResolvedValue(selfLogReportRepository)
    createNoopSelfReportRepository.mockReturnValue(noopSelfReportRepository)
  })

  it('should create the repository storing at the picked file of the self-reports directory when there is a self reports config', async () => {
    const selfReportsConfig = getMockSelfReportsConfig({
      selfReportsDirPath: '/server_logs/self_reports/Echo/log',
      parseLogFileSelfReportFileName: 'parseLogFile.jsonl'
    })

    const selfReportRepository = await createSelfReportRepository({
      logsRepository,
      filesService,
      selfReportsConfig,
      getSelfReportFileName: ({ parseLogFileSelfReportFileName }) => parseLogFileSelfReportFileName,
      logger
    })

    expect(selfReportRepository).toBe(selfLogReportRepository)
    expect(createFileSessionJobIdApi).toHaveBeenCalledWith(selfReportsConfig, filesService)
    expect(createSelfLogReportRepository).toHaveBeenCalledWith({
      logsRepository,
      sessionJobIdApi,
      selfReportsConfig,
      selfReportsLocation: '/server_logs/self_reports/Echo/log/parseLogFile.jsonl',
      selfReportsLocationName: 'parseLogFile',
      logger
    })
  })

  it('should create a repository storing nothing when there is no self reports config', async () => {
    const selfReportRepository = await createSelfReportRepository({
      logsRepository,
      filesService,
      selfReportsConfig: undefined,
      getSelfReportFileName: ({ parseLogFileSelfReportFileName }) => parseLogFileSelfReportFileName,
      logger
    })

    expect(selfReportRepository).toBe(noopSelfReportRepository)
    expect(createSelfLogReportRepository).not.toHaveBeenCalled()
  })
})
