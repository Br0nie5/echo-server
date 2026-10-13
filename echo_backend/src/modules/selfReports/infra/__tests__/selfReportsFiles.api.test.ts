import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import { createSelfReportsFilesApi } from '../selfReportsFiles.api.js'

const selfReportFilesLocation = {
  selfReportsDirPath: '/self_reports/Echo',
  selfReportFileExtension: '.jsonl'
}

const filesService = getMockFilesService()

beforeEach(() => {
  vi.resetAllMocks()
})

// The self-report files are tested through the server (`logs.routes.test.ts`). Here is the file
// that cannot be read, which the file system of the tests never makes happen.
describe('SelfReportsFilesApi', () => {
  describe('getSelfReportLines', () => {
    it('Should throw the error of the files service when the file exists but cannot be read', async () => {
      const readError = new Error('EACCES: permission denied')
      filesService.getFileLines.mockRejectedValue(readError)

      await expect(
        createSelfReportsFilesApi(selfReportFilesLocation, filesService).getSelfReportLines(
          '/self_reports/Echo/parseLogs.jsonl'
        )
      ).rejects.toBe(readError)
    })
  })
})
