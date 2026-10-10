import path from 'path'

import { beforeEach, describe, it, expect, vi } from 'vitest'

import { FileDoesNotExistError } from '../../../../shared/services/fileDoesNotExistError.js'
import { getMockLogsConfig } from '../../../../test/mocks/mockConfigs.js'
import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import type { LogFileDto } from '../dto/logFile.dto.js'
import { createLogsFilesApi } from '../logsFiles.api.js'

const logsConfig = getMockLogsConfig({ logsDirsPaths: ['/logs'], logFileExtension: '.jsonl' })

const filesService = getMockFilesService()

/** Makes `filesService` find, among `filesPathsByDirectory`, the files its caller asks for. */
const mockFoundFiles = (filesPathsByDirectory: Record<string, string[]>): void => {
  filesService.getFilesPaths.mockImplementation(
    async (directoryPath: string, isFileIncluded: (filePath: string) => boolean) =>
      filesPathsByDirectory[directoryPath].filter(isFileIncluded)
  )
}

const logFile = (filePath: string): LogFileDto => ({
  path: filePath,
  fileName: 'file',
  groupName: undefined
})

beforeEach(() => {
  vi.resetAllMocks()
})

describe('LogsFilesApi', () => {
  describe('getAllLogFiles', () => {
    it('Should list the files with the log file extension, with their name and group', async () => {
      mockFoundFiles({
        '/logs': [
          '/logs/root.jsonl',
          '/logs/notes.txt',
          '/logs/docker/compose.jsonl',
          '/logs/docker/utils/log/backup.jsonl',
          '/logs/docker/utils/backups/daily.jsonl'
        ]
      })

      expect(await createLogsFilesApi(logsConfig, filesService).getAllLogFiles()).toEqual([
        { path: '/logs/root.jsonl', fileName: 'root', groupName: undefined },
        { path: '/logs/docker/compose.jsonl', fileName: 'compose', groupName: undefined },
        { path: '/logs/docker/utils/log/backup.jsonl', fileName: 'backup', groupName: 'utils' },
        {
          path: '/logs/docker/utils/backups/daily.jsonl',
          fileName: 'daily',
          groupName: 'utils_backups'
        }
      ])
    })

    it('Should list the files with another log file extension when the config gives one', async () => {
      mockFoundFiles({ '/logs': ['/logs/root.jsonl', '/logs/notes.txt'] })

      const logsFilesApi = createLogsFilesApi(
        getMockLogsConfig({ logsDirsPaths: ['/logs'], logFileExtension: '.txt' }),
        filesService
      )

      expect(await logsFilesApi.getAllLogFiles()).toEqual([
        { path: '/logs/notes.txt', fileName: 'notes', groupName: undefined }
      ])
    })

    it('Should leave the directories named like the log files directory of the config out of the group', async () => {
      mockFoundFiles({ '/logs': ['/logs/docker/utils/output/log/backup.jsonl'] })

      const logsFilesApi = createLogsFilesApi(
        getMockLogsConfig({ logsDirsPaths: ['/logs'], logFilesDirName: 'output' }),
        filesService
      )

      expect(await logsFilesApi.getAllLogFiles()).toEqual([
        {
          path: '/logs/docker/utils/output/log/backup.jsonl',
          fileName: 'backup',
          groupName: 'utils_log'
        }
      ])
    })

    it('Should list the files of every logs directory, each grouped from its own directory', async () => {
      mockFoundFiles({
        '/logs': ['/logs/docker/utils/backup.jsonl'],
        '/server_logs': ['/server_logs/self_reports/Echo/log/parseLogFile.jsonl']
      })

      const logsFilesApi = createLogsFilesApi(
        getMockLogsConfig({ logsDirsPaths: ['/logs', '/server_logs'] }),
        filesService
      )

      expect(await logsFilesApi.getAllLogFiles()).toEqual([
        { path: '/logs/docker/utils/backup.jsonl', fileName: 'backup', groupName: 'utils' },
        {
          path: '/server_logs/self_reports/Echo/log/parseLogFile.jsonl',
          fileName: 'parseLogFile',
          groupName: 'Echo'
        }
      ])
    })

    it.each(['/logs/', './logs', 'logs'])(
      'Should group the files the same way when the logs directory is written %s',
      async (logsDirPath) => {
        const filePath = path.join(logsDirPath, 'docker', 'utils', 'backup.jsonl')
        mockFoundFiles({ [logsDirPath]: [filePath] })

        const logsFilesApi = createLogsFilesApi(
          getMockLogsConfig({ logsDirsPaths: [logsDirPath] }),
          filesService
        )

        expect(await logsFilesApi.getAllLogFiles()).toEqual([
          { path: filePath, fileName: 'backup', groupName: 'utils' }
        ])
      }
    )

    it('Should throw the error of the files service when a logs directory cannot be read', async () => {
      filesService.getFilesPaths.mockRejectedValue(new Error('ENOENT'))

      await expect(createLogsFilesApi(logsConfig, filesService).getAllLogFiles()).rejects.toThrow(
        'ENOENT'
      )
    })
  })

  describe('getRawLogLines', () => {
    it('Should return the lines of the file with their position', async () => {
      const file = logFile('/logs/file.jsonl')
      filesService.getFileLines.mockResolvedValue(['foo', 'bar'])

      expect(await createLogsFilesApi(logsConfig, filesService).getRawLogLines(file)).toEqual([
        { logFile: file, index: 0, content: 'foo' },
        { logFile: file, index: 1, content: 'bar' }
      ])
      expect(filesService.getFileLines).toHaveBeenCalledWith('/logs/file.jsonl')
    })

    it('Should return no line when the file does not exist', async () => {
      filesService.getFileLines.mockRejectedValue(new FileDoesNotExistError('/logs/missing.jsonl'))

      expect(
        await createLogsFilesApi(logsConfig, filesService).getRawLogLines(
          logFile('/logs/missing.jsonl')
        )
      ).toEqual([])
    })

    it('Should throw the error of the files service when the file cannot be read', async () => {
      filesService.getFileLines.mockRejectedValue(new Error('EACCES'))

      await expect(
        createLogsFilesApi(logsConfig, filesService).getRawLogLines(logFile('/logs/locked.jsonl'))
      ).rejects.toThrow('EACCES')
    })
  })

  describe('getLogFile', () => {
    it('Should give the name and the group of a file of a logs directory', () => {
      const logsFilesApi = createLogsFilesApi(
        getMockLogsConfig({ logsDirsPaths: ['/logs', '/server_logs'] }),
        filesService
      )

      expect(
        logsFilesApi.getLogFile('/server_logs/self_reports/Echo/log/parseLogFile.jsonl')
      ).toEqual({
        path: '/server_logs/self_reports/Echo/log/parseLogFile.jsonl',
        fileName: 'parseLogFile',
        groupName: 'Echo'
      })
    })

    it.each(['/elsewhere/docker/utils/backup.jsonl', '/logs_backup/docker/utils/backup.jsonl'])(
      'Should give no group to %s, which is in none of the logs directories',
      (filePath) => {
        expect(createLogsFilesApi(logsConfig, filesService).getLogFile(filePath)).toEqual({
          path: filePath,
          fileName: 'backup',
          groupName: undefined
        })
      }
    )
  })

  describe('saveRawLogLines', () => {
    it('Should create the directory of the file, then replace its lines, in the order they are given', async () => {
      const steps: string[] = []
      filesService.createDirectory.mockImplementation(async () => {
        steps.push('createDirectory')
      })
      filesService.replaceFileLines.mockImplementation(async () => {
        steps.push('replaceFileLines')
      })

      const file = logFile('/server_logs/self_reports/Echo/log/parseLogFile.jsonl')

      await createLogsFilesApi(logsConfig, filesService).saveRawLogLines(file, [
        { logFile: file, index: 0, content: 'foo' },
        { logFile: file, index: 1, content: 'bar' }
      ])

      expect(filesService.createDirectory).toHaveBeenCalledWith(
        '/server_logs/self_reports/Echo/log'
      )
      expect(filesService.replaceFileLines).toHaveBeenCalledWith(
        '/server_logs/self_reports/Echo/log/parseLogFile.jsonl',
        ['foo', 'bar']
      )
      expect(steps).toEqual(['createDirectory', 'replaceFileLines'])
    })

    it('Should throw the error of the files service when the file cannot be written', async () => {
      filesService.replaceFileLines.mockRejectedValue(new Error('EACCES'))

      await expect(
        createLogsFilesApi(logsConfig, filesService).saveRawLogLines(
          logFile('/logs/file.jsonl'),
          []
        )
      ).rejects.toThrow('EACCES')
    })
  })
})
