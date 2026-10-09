import { constants as fsConstants } from 'fs'
import path from 'path'

import { describe, it, expect, vi } from 'vitest'

import { getMockLogsConfig } from '../../../../test/mocks/configs.js'
import type { LogFileDto } from '../dto/logFile.dto.js'
import { createLogsFilesApi, type FileSystem } from '../logsFiles.api.js'

const logsConfig = getMockLogsConfig({ logsDirsPaths: ['/logs'], logFileExtension: '.jsonl' })

const entry = (name: string, type: 'file' | 'directory' | 'other'): object => ({
  name,
  isFile: (): boolean => type === 'file',
  isDirectory: (): boolean => type === 'directory'
})

const buildFileSystem = ({
  directories = {},
  files = {},
  missing = [],
  unreadable = [],
  overrides = {}
}: {
  directories?: Record<string, object[]>
  files?: Record<string, string>
  missing?: string[]
  unreadable?: string[]
  overrides?: Partial<FileSystem>
}): FileSystem =>
  ({
    readdir: vi.fn(async (directory: string) => directories[directory]),
    access: vi.fn(async (filePath: string, mode: number) => {
      if (missing.includes(filePath)) {
        throw new Error('ENOENT')
      }
      if (unreadable.includes(filePath) && mode === fsConstants.R_OK) {
        throw new Error('EACCES')
      }
    }),
    readFile: vi.fn(async (filePath: string) => files[filePath]),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    rename: vi.fn(),
    appendFile: vi.fn(),
    ...overrides
  }) as unknown as FileSystem

const WRITTEN_FILE_PATH = '/logs/server/Echo/log/parseLogFile.jsonl'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const logLine = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({
    job_id: 1,
    timestamp: '2026-09-19T14:41:09.669Z',
    status: 'WARNING',
    message: 'bad line',
    call_file: 'someFile',
    call_line: 3,
    ...overrides
  })

const datedLine = (timestamp: unknown): string => logLine({ timestamp })

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * MILLISECONDS_PER_DAY).toISOString()

const logFile = (filePath: string): LogFileDto => ({
  path: filePath,
  fileName: 'file',
  groupName: undefined
})

describe('LogsFilesApi', () => {
  describe('getAllLogFiles', () => {
    it('should list the .jsonl files recursively, with their name and group', async () => {
      const logsFilesApi = createLogsFilesApi(
        logsConfig,
        buildFileSystem({
          directories: {
            '/logs': [
              entry('root.jsonl', 'file'),
              entry('notes.txt', 'file'),
              entry('docker', 'directory')
            ],
            [path.join('/logs', 'docker')]: [entry('utils', 'directory')],
            [path.join('/logs', 'docker', 'utils')]: [entry('log', 'directory')],
            [path.join('/logs', 'docker')]: [
              entry('compose.jsonl', 'file'),
              entry('utils', 'directory')
            ],
            [path.join('/logs', 'docker', 'utils')]: [
              entry('log', 'directory'),
              entry('backups', 'directory')
            ],
            [path.join('/logs', 'docker', 'utils', 'log')]: [entry('backup.jsonl', 'file')],
            [path.join('/logs', 'docker', 'utils', 'backups')]: [entry('daily.jsonl', 'file')]
          }
        })
      )

      expect(await logsFilesApi.getAllLogFiles()).toEqual([
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

    it('should list the files of every logs directory, each grouped from its own directory', async () => {
      const logsFilesApi = createLogsFilesApi(
        getMockLogsConfig({ logsDirsPaths: ['/logs', '/server_logs'] }),
        buildFileSystem({
          directories: {
            '/logs': [entry('docker', 'directory')],
            [path.join('/logs', 'docker')]: [entry('utils', 'directory')],
            [path.join('/logs', 'docker', 'utils')]: [entry('backup.jsonl', 'file')],
            '/server_logs': [entry('self_reports', 'directory')],
            [path.join('/server_logs', 'self_reports')]: [entry('Echo', 'directory')],
            [path.join('/server_logs', 'self_reports', 'Echo')]: [entry('log', 'directory')],
            [path.join('/server_logs', 'self_reports', 'Echo', 'log')]: [
              entry('parseLogFile.jsonl', 'file')
            ]
          }
        })
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

    it('should ignore the entries that are neither directories nor files', async () => {
      const logsFilesApi = createLogsFilesApi(
        logsConfig,
        buildFileSystem({ directories: { '/logs': [entry('socket.jsonl', 'other')] } })
      )

      expect(await logsFilesApi.getAllLogFiles()).toEqual([])
    })
  })

  describe('getRawLogLines', () => {
    it('should return the non-blank lines of the file with their position', async () => {
      const file = logFile('/logs/file.jsonl')
      const logsFilesApi = createLogsFilesApi(
        logsConfig,
        buildFileSystem({ files: { '/logs/file.jsonl': 'foo\n\nbar\n  \n' } })
      )

      expect(await logsFilesApi.getRawLogLines(file)).toEqual([
        { logFile: file, index: 0, content: 'foo' },
        { logFile: file, index: 1, content: 'bar' }
      ])
    })

    it('should return no line when the file does not exist', async () => {
      const fileSystem = buildFileSystem({ missing: ['/logs/nope.jsonl'] })

      expect(
        await createLogsFilesApi(logsConfig, fileSystem).getRawLogLines(logFile('/logs/nope.jsonl'))
      ).toEqual([])
      expect(fileSystem.readFile).not.toHaveBeenCalled()
    })

    it('should throw the error of the file system when the file exists but is not readable', async () => {
      const fileSystem = buildFileSystem({ unreadable: ['/logs/locked.jsonl'] })

      await expect(
        createLogsFilesApi(logsConfig, fileSystem).getRawLogLines(logFile('/logs/locked.jsonl'))
      ).rejects.toThrow('EACCES')
      expect(fileSystem.readFile).not.toHaveBeenCalled()
    })

    it('should use the real file system by default', async () => {
      const logsFilesApi = createLogsFilesApi(
        getMockLogsConfig({ logsDirsPaths: ['/does/not/exist'] })
      )

      expect(await logsFilesApi.getRawLogLines(logFile('/does/not/exist/file.jsonl'))).toEqual([])
    })
  })

  describe('createDirectory', () => {
    it('should create the directory and its parents', async () => {
      const fileSystem = buildFileSystem({})

      await createLogsFilesApi(logsConfig, fileSystem).createDirectory('/logs/server/Echo/log')

      expect(fileSystem.mkdir).toHaveBeenCalledWith('/logs/server/Echo/log', { recursive: true })
    })
  })

  describe('rotateLogFile', () => {
    it('should remove the lines older than retentionDays and keep the rest, replacing the file in one step', async () => {
      const oldLine = datedLine(daysAgo(20))
      const recentLine = datedLine(daysAgo(1))
      const steps: string[] = []
      const fileSystem = buildFileSystem({
        files: { [WRITTEN_FILE_PATH]: `${oldLine}\n${recentLine}\n` },
        overrides: {
          writeFile: vi.fn(async () => {
            steps.push('writeFile')
          }),
          rename: vi.fn(async () => {
            steps.push('rename')
          })
        }
      })

      await createLogsFilesApi(logsConfig, fileSystem).rotateLogFile(WRITTEN_FILE_PATH, 10)

      expect(fileSystem.writeFile).toHaveBeenCalledWith(
        `${WRITTEN_FILE_PATH}.tmp`,
        `${recentLine}\n`,
        'utf-8'
      )
      expect(fileSystem.rename).toHaveBeenCalledWith(`${WRITTEN_FILE_PATH}.tmp`, WRITTEN_FILE_PATH)
      expect(steps).toEqual(['writeFile', 'rename'])
    })

    it('should empty the file when every line is older than retentionDays', async () => {
      const fileSystem = buildFileSystem({
        files: { [WRITTEN_FILE_PATH]: `${datedLine(daysAgo(20))}\n` }
      })

      await createLogsFilesApi(logsConfig, fileSystem).rotateLogFile(WRITTEN_FILE_PATH, 10)

      expect(fileSystem.writeFile).toHaveBeenCalledWith(`${WRITTEN_FILE_PATH}.tmp`, '', 'utf-8')
    })

    it('should leave the file untouched when no line is older than retentionDays', async () => {
      const fileSystem = buildFileSystem({
        files: { [WRITTEN_FILE_PATH]: `${datedLine(daysAgo(1))}\n` }
      })

      await createLogsFilesApi(logsConfig, fileSystem).rotateLogFile(WRITTEN_FILE_PATH, 10)

      expect(fileSystem.writeFile).not.toHaveBeenCalled()
      expect(fileSystem.rename).not.toHaveBeenCalled()
    })

    it('should remove the lines that hold no log line or whose timestamp is not a date', async () => {
      const recentLine = datedLine(daysAgo(1))
      const fileSystem = buildFileSystem({
        files: {
          [WRITTEN_FILE_PATH]: `not json\n${datedLine('not a date')}\n${recentLine}\n${datedLine(42)}\n`
        }
      })

      await createLogsFilesApi(logsConfig, fileSystem).rotateLogFile(WRITTEN_FILE_PATH, 10)

      expect(fileSystem.writeFile).toHaveBeenCalledWith(
        `${WRITTEN_FILE_PATH}.tmp`,
        `${recentLine}\n`,
        'utf-8'
      )
    })
  })

  describe('deleteLogFileSelectedLines', () => {
    it('should remove every log line to delete and keep the others in order', async () => {
      const firstLine = logLine({ job_id: 1 })
      const secondLine = logLine({ job_id: 2 })
      const thirdLine = logLine({ job_id: 3 })
      const fileSystem = buildFileSystem({
        files: {
          [WRITTEN_FILE_PATH]: `${firstLine}\n${secondLine}\n\n  \n${thirdLine}\n${secondLine}\n`
        }
      })

      await createLogsFilesApi(logsConfig, fileSystem).deleteLogFileSelectedLines(
        WRITTEN_FILE_PATH,
        ({ job_id }) => job_id === 2
      )

      expect(fileSystem.readFile).toHaveBeenCalledWith(WRITTEN_FILE_PATH, 'utf-8')
      expect(fileSystem.writeFile).toHaveBeenCalledWith(
        `${WRITTEN_FILE_PATH}.tmp`,
        `${firstLine}\n${thirdLine}\n`,
        'utf-8'
      )
      expect(fileSystem.rename).toHaveBeenCalledWith(`${WRITTEN_FILE_PATH}.tmp`, WRITTEN_FILE_PATH)
    })

    it('should remove the lines that hold no log line', async () => {
      const validLine = logLine()
      const fileSystem = buildFileSystem({
        files: {
          [WRITTEN_FILE_PATH]: `not json\n${validLine}\n${logLine({ call_line: undefined })}\n`
        }
      })

      await createLogsFilesApi(logsConfig, fileSystem).deleteLogFileSelectedLines(
        WRITTEN_FILE_PATH,
        () => false
      )

      expect(fileSystem.writeFile).toHaveBeenCalledWith(
        `${WRITTEN_FILE_PATH}.tmp`,
        `${validLine}\n`,
        'utf-8'
      )
    })

    it('should leave the file untouched when there is no line to delete', async () => {
      const fileSystem = buildFileSystem({
        files: { [WRITTEN_FILE_PATH]: `${logLine({ job_id: 1 })}\n${logLine({ job_id: 2 })}\n` }
      })

      await createLogsFilesApi(logsConfig, fileSystem).deleteLogFileSelectedLines(
        WRITTEN_FILE_PATH,
        () => false
      )

      expect(fileSystem.writeFile).not.toHaveBeenCalled()
      expect(fileSystem.rename).not.toHaveBeenCalled()
    })

    it('should leave alone a file that does not exist yet', async () => {
      const fileSystem = buildFileSystem({ missing: [WRITTEN_FILE_PATH] })

      await createLogsFilesApi(logsConfig, fileSystem).deleteLogFileSelectedLines(
        WRITTEN_FILE_PATH,
        () => true
      )

      expect(fileSystem.writeFile).not.toHaveBeenCalled()
    })

    it('should throw the error of the file system when the file exists but is not readable', async () => {
      const fileSystem = buildFileSystem({ unreadable: [WRITTEN_FILE_PATH] })

      await expect(
        createLogsFilesApi(logsConfig, fileSystem).deleteLogFileSelectedLines(
          WRITTEN_FILE_PATH,
          () => true
        )
      ).rejects.toThrow('EACCES')
      expect(fileSystem.writeFile).not.toHaveBeenCalled()
    })
  })

  describe('appendLogFileLines', () => {
    it('should append one JSON line per log line to the file in a single write', async () => {
      const fileSystem = buildFileSystem({})
      const firstLine = logLine({ job_id: 1 })
      const secondLine = logLine({ job_id: 2 })

      await createLogsFilesApi(logsConfig, fileSystem).appendLogFileLines(WRITTEN_FILE_PATH, [
        JSON.parse(firstLine),
        JSON.parse(secondLine)
      ])

      expect(fileSystem.appendFile).toHaveBeenCalledTimes(1)
      expect(fileSystem.appendFile).toHaveBeenCalledWith(
        WRITTEN_FILE_PATH,
        `${firstLine}\n${secondLine}\n`,
        'utf-8'
      )
    })
  })
})
