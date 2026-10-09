import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../modules/selfReport/infra/fileSessionJobId.api.js')
vi.mock('../../../modules/selfReport/infra/noopSelfReport.repository.js')
vi.mock('../../../modules/selfReport/infra/selfFileReport.repository.js')

import type { LogsFilesApi } from '../../../modules/logs/infra/logsFiles.api.js'
import type { SelfReportRepository } from '../../../modules/selfReport/domain/selfReport.repository.js'
import {
  createFileSessionJobIdApi as actualCreateFileSessionJobIdApi,
  type SessionJobIdApi
} from '../../../modules/selfReport/infra/fileSessionJobId.api.js'
import { createNoopSelfReportRepository as actualCreateNoopSelfReportRepository } from '../../../modules/selfReport/infra/noopSelfReport.repository.js'
import { createSelfFileReportRepository as actualCreateSelfFileReportRepository } from '../../../modules/selfReport/infra/selfFileReport.repository.js'
import { getMockSelfReportsConfig } from '../../../test/mocks/configs.js'
import { getSelfReportRepository } from '../getSelfReportRepository.js'

const createFileSessionJobIdApi = vi.mocked(actualCreateFileSessionJobIdApi)
const createNoopSelfReportRepository = vi.mocked(actualCreateNoopSelfReportRepository)
const createSelfFileReportRepository = vi.mocked(actualCreateSelfFileReportRepository)

const server = Fastify()
const logsFilesApi = {} as LogsFilesApi
const sessionJobIdApi = {} as SessionJobIdApi
const selfFileReportRepository: SelfReportRepository = { saveSelfReports: vi.fn() }
const noopSelfReportRepository: SelfReportRepository = { saveSelfReports: vi.fn() }

describe('getSelfReportRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createFileSessionJobIdApi.mockReturnValue(sessionJobIdApi)
    createSelfFileReportRepository.mockResolvedValue(selfFileReportRepository)
    createNoopSelfReportRepository.mockReturnValue(noopSelfReportRepository)
  })

  it('should give the repository storing in the picked file when there is a self reports config', async () => {
    const selfReportsConfig = getMockSelfReportsConfig({
      parseLogFileSelfReportFileName: 'parseLogFile.jsonl'
    })

    const selfReportRepository = await getSelfReportRepository(
      server,
      logsFilesApi,
      selfReportsConfig,
      ({ parseLogFileSelfReportFileName }) => parseLogFileSelfReportFileName
    )

    expect(selfReportRepository).toBe(selfFileReportRepository)
    expect(createFileSessionJobIdApi).toHaveBeenCalledWith(selfReportsConfig)
    expect(createSelfFileReportRepository).toHaveBeenCalledWith({
      logsFilesApi,
      sessionJobIdApi,
      selfReportsConfig,
      selfReportFileName: 'parseLogFile.jsonl',
      logger: server.log
    })
  })

  it('should give a repository storing nothing when there is no self reports config', async () => {
    const selfReportRepository = await getSelfReportRepository(
      server,
      logsFilesApi,
      undefined,
      ({ parseLogFileSelfReportFileName }) => parseLogFileSelfReportFileName
    )

    expect(selfReportRepository).toBe(noopSelfReportRepository)
    expect(createSelfFileReportRepository).not.toHaveBeenCalled()
  })
})
