import path from 'path'

import { describe, it, expect, vi } from 'vitest'

import type { LogFileDto } from '../dto/logFile.dto.js'
import { createFileLogsApi, type FileSystem } from '../fileLogs.api.js'

const entry = (name: string, type: 'file' | 'directory' | 'other'): object => ({
  name,
  isFile: (): boolean => type === 'file',
  isDirectory: (): boolean => type === 'directory'
})

const buildFileSystem = ({
  directories = {},
  files = {},
  unreadable = []
}: {
  directories?: Record<string, object[]>
  files?: Record<string, string>
  unreadable?: string[]
}): FileSystem =>
  ({
    readdir: vi.fn(async (directory: string) => directories[directory]),
    access: vi.fn(async (filePath: string) => {
      if (unreadable.includes(filePath)) {
        throw new Error('ENOENT')
      }
    }),
    readFile: vi.fn(async (filePath: string) => files[filePath])
  }) as unknown as FileSystem

const logFile = (filePath: string): LogFileDto => ({
  path: filePath,
  fileName: 'file',
  groupName: undefined
})

describe('FileLogsApi', () => {
  describe('getAllLogFilesPaths', () => {
    it('should list the paths of the .jsonl files recursively', async () => {
      const fileLogsApi = createFileLogsApi(
        '/logs',
        buildFileSystem({
          directories: {
            '/logs': [
              entry('root.jsonl', 'file'),
              entry('notes.txt', 'file'),
              entry('socket.jsonl', 'other'),
              entry('docker', 'directory')
            ],
            [path.join('/logs', 'docker')]: [entry('compose.jsonl', 'file')]
          }
        })
      )

      expect(await fileLogsApi.getAllLogFilesPaths()).toEqual([
        '/logs/root.jsonl',
        '/logs/docker/compose.jsonl'
      ])
    })
  })

  describe('getAllLogsFromFile', () => {
    const fileLogsApi = createFileLogsApi('/logs', buildFileSystem({}))

    it('should name the file after its base name, without a group at the first two levels', () => {
      expect(fileLogsApi.getAllLogsFromFile('/logs/docker/compose.jsonl')).toEqual({
        path: '/logs/docker/compose.jsonl',
        fileName: 'compose',
        groupName: undefined
      })
    })

    it('should group the file by its directories, skipping the log directory', () => {
      expect(fileLogsApi.getAllLogsFromFile('/logs/docker/utils/log/backups/daily.jsonl')).toEqual({
        path: '/logs/docker/utils/log/backups/daily.jsonl',
        fileName: 'daily',
        groupName: 'utils_backups'
      })
    })
  })

  describe('getAllLogsFromFiles', () => {
    it('should list the .jsonl files recursively, with their name and group', async () => {
      const fileLogsApi = createFileLogsApi(
        '/logs',
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

      expect(await fileLogsApi.getAllLogsFromFiles()).toEqual([
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

    it('should ignore the entries that are neither directories nor files', async () => {
      const fileLogsApi = createFileLogsApi(
        '/logs',
        buildFileSystem({ directories: { '/logs': [entry('socket.jsonl', 'other')] } })
      )

      expect(await fileLogsApi.getAllLogsFromFiles()).toEqual([])
    })
  })

  describe('getRawLogLines', () => {
    it('should return the non-blank lines of the file with their position', async () => {
      const file = logFile('/logs/file.jsonl')
      const fileLogsApi = createFileLogsApi(
        '/logs',
        buildFileSystem({ files: { '/logs/file.jsonl': 'foo\n\nbar\n  \n' } })
      )

      expect(await fileLogsApi.getRawLogLines(file)).toEqual([
        { logFile: file, index: 0, content: 'foo' },
        { logFile: file, index: 1, content: 'bar' }
      ])
    })

    it('should throw an EchoError if the file does not exist or is not readable', async () => {
      const fileLogsApi = createFileLogsApi(
        '/logs',
        buildFileSystem({ unreadable: ['/logs/nope.jsonl'] })
      )

      await expect(fileLogsApi.getRawLogLines(logFile('/logs/nope.jsonl'))).rejects.toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('does not exist or is not readable')
      })
    })

    it('should use the real file system by default', async () => {
      const fileLogsApi = createFileLogsApi('/does/not/exist')

      await expect(
        fileLogsApi.getRawLogLines(logFile('/does/not/exist/file.jsonl'))
      ).rejects.toMatchObject({ statusCode: 500 })
    })
  })
})
