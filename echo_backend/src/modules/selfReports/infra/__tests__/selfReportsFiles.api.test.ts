import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FileDoesNotExistError } from '../../../../shared/services/fileDoesNotExistError.js'
import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import { createSelfReportsFilesApi } from '../selfReportsFiles.api.js'

const filesService = getMockFilesService()

beforeEach(() => {
  vi.resetAllMocks()
})

describe('SelfReportsFilesApi', () => {
  describe('getSelfReportLines', () => {
    it('Should give no line for a file removed since it was set up', async () => {
      filesService.getFileLines.mockRejectedValue(
        new FileDoesNotExistError('/self_reports/Echo/parseLogs.jsonl')
      )

      await expect(
        createSelfReportsFilesApi(filesService).getSelfReportLines(
          '/self_reports/Echo/parseLogs.jsonl'
        )
      ).resolves.toEqual([])
    })

    it('Should throw the error of the files service when the file exists but cannot be read', async () => {
      const readError = new Error('EACCES: permission denied')
      filesService.getFileLines.mockRejectedValue(readError)

      await expect(
        createSelfReportsFilesApi(filesService).getSelfReportLines(
          '/self_reports/Echo/parseLogs.jsonl'
        )
      ).rejects.toBe(readError)
    })
  })
})
