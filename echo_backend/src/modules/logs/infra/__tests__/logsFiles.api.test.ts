import { beforeEach, describe, it, expect, vi } from 'vitest'

import { getMockLogsConfig } from '../../../../test/mocks/mockConfigs.js'
import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import { createLogsFilesApi } from '../logsFiles.api.js'

const logsConfig = getMockLogsConfig({
  logsDirsPaths: ['/logs'],
  logFileExtension: '.jsonl',
  logFilesDirName: 'logs'
})

const filesService = getMockFilesService()

beforeEach(() => {
  vi.resetAllMocks()
})

// The log files are tested through the server (`logs.routes.test.ts`). Here are the variants of
// the group of a file, and the files that cannot be read, which the file system of the tests never
// makes happen.
describe('LogsFilesApi', () => {
  describe('getAllLogFiles', () => {
    it.each([
      {
        reason: 'directly in the logs directory',
        filePath: '/logs/ping.jsonl',
        groupName: undefined
      },
      {
        reason: 'in a first directory, which is never part of the group',
        filePath: '/logs/shop/open_shop.jsonl',
        groupName: undefined
      },
      {
        reason: 'in a second directory',
        filePath: '/logs/shop/stock/sync_stock.jsonl',
        groupName: 'stock'
      },
      {
        reason: 'in a directory named like the one of the log files, which is left out',
        filePath: '/logs/shop/stock/logs/sync_stock.jsonl',
        groupName: 'stock'
      },
      {
        reason: 'in several directories, joined',
        filePath: '/logs/shop/stock/exports/daily.jsonl',
        groupName: 'stock_exports'
      }
    ])('Should give the group $groupName to a file $reason', async ({ filePath, groupName }) => {
      filesService.getFilesPaths.mockResolvedValue([filePath])

      const [logFile] = await createLogsFilesApi(logsConfig, filesService).getAllLogFiles()

      expect(logFile).toMatchObject({ path: filePath, groupName })
    })

    it('Should throw the error of the files service when a logs directory cannot be read', async () => {
      const readError = new Error('EACCES: permission denied')
      filesService.getFilesPaths.mockRejectedValue(readError)

      await expect(createLogsFilesApi(logsConfig, filesService).getAllLogFiles()).rejects.toBe(
        readError
      )
    })
  })

  describe('getRawLogLines', () => {
    it('Should throw the error of the files service when the file exists but cannot be read', async () => {
      const readError = new Error('EACCES: permission denied')
      filesService.getFileLines.mockRejectedValue(readError)
      const logsFilesApi = createLogsFilesApi(logsConfig, filesService)

      await expect(
        logsFilesApi.getRawLogLines(logsFilesApi.getLogFile('/logs/ping.jsonl'))
      ).rejects.toBe(readError)
    })
  })
})
