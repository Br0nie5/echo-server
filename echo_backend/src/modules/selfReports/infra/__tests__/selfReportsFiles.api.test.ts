import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import { createSelfReportsFilesApi } from '../selfReportsFiles.api.js'

const filesService = getMockFilesService()

beforeEach(() => {
  vi.resetAllMocks()
})

describe('SelfReportsFilesApi', () => {
  describe('getSelfReportLines', () => {
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
