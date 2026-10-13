import { beforeEach, describe, it, expect, vi } from 'vitest'

import { FileDoesNotExistError } from '../../../../shared/services/fileDoesNotExistError.js'
import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import { createLogsFilesApi } from '../logsFiles.api.js'

const logsFilesLocation = {
  logsDirPath: '/logs',
  logFileExtension: '.jsonl',
  logFilesDirName: 'logs'
}

const filesService = getMockFilesService()

beforeEach(() => {
  vi.resetAllMocks()
})

// The log files are tested through the server (`logs.routes.test.ts`). Here are the files that
// cannot be read, which the file system of the tests never makes happen, the file that is gone
// once it is read, which no request can make happen, and every case of the group of a log file.
describe('LogsFilesApi', () => {
  describe('getAllLogFiles', () => {
    it('Should throw the error of the files service when the logs directory cannot be read', async () => {
      const readError = new Error('EACCES: permission denied')
      filesService.getFilesPaths.mockRejectedValue(readError)

      await expect(
        createLogsFilesApi(logsFilesLocation, filesService).getAllLogFiles()
      ).rejects.toBe(readError)
    })

    it.each([
      {
        reason: 'directly in the logs directory',
        relativeFilePath: 'ping.jsonl',
        groupName: undefined
      },
      {
        reason: 'in a first directory, which is never part of the group',
        relativeFilePath: 'shop/open_shop.jsonl',
        groupName: undefined
      },
      {
        reason: 'in a second directory',
        relativeFilePath: 'shop/stock/sync_stock.jsonl',
        groupName: 'stock'
      },
      {
        reason: 'in a directory named like the one to leave out',
        relativeFilePath: 'shop/stock/logs/sync_stock.jsonl',
        groupName: 'stock'
      },
      {
        reason:
          'in a first directory named like the one to leave out, the next one being the first',
        relativeFilePath: 'logs/shop/stock/sync_stock.jsonl',
        groupName: 'stock'
      },
      {
        reason: 'in several directories, joined',
        relativeFilePath: 'shop/stock/exports/daily.jsonl',
        groupName: 'stock_exports'
      },
      {
        reason: 'that is not below the logs directory',
        relativeFilePath: undefined,
        groupName: undefined
      }
    ])(
      'Should give the group $groupName to a log file $reason',
      async ({ relativeFilePath, groupName }) => {
        filesService.getFilesPaths.mockResolvedValue(['/logs/sync_stock.jsonl'])
        filesService.getRelativeFilePath.mockReturnValue(relativeFilePath)

        const [logFile] = await createLogsFilesApi(
          { logsDirPath: '/logs', logFileExtension: '.jsonl', logFilesDirName: 'logs' },
          filesService
        ).getAllLogFiles()

        expect(logFile.groupName).toBe(groupName)
        expect(filesService.getRelativeFilePath).toHaveBeenCalledWith(
          '/logs/sync_stock.jsonl',
          '/logs'
        )
      }
    )
  })

  describe('getRawLogLines', () => {
    it('Should give no line for a file that does not exist', async () => {
      filesService.getFileLines.mockRejectedValue(new FileDoesNotExistError('/logs/ping.jsonl'))

      await expect(
        createLogsFilesApi(logsFilesLocation, filesService).getRawLogLines({
          path: '/logs/ping.jsonl',
          fileName: 'ping',
          groupName: undefined
        })
      ).resolves.toEqual([])
    })

    it('Should throw the error of the files service when the file exists but cannot be read', async () => {
      const readError = new Error('EACCES: permission denied')
      filesService.getFileLines.mockRejectedValue(readError)

      await expect(
        createLogsFilesApi(logsFilesLocation, filesService).getRawLogLines({
          path: '/logs/ping.jsonl',
          fileName: 'ping',
          groupName: undefined
        })
      ).rejects.toBe(readError)
    })
  })
})
