import { constants as fsConstants } from 'fs'
import path from 'path'

import { describe, it, expect, vi } from 'vitest'

import { createFilesService, type FileSystem } from '../files.service.js'

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
    ...overrides
  }) as unknown as FileSystem

const FILE_PATH = '/server_logs/self_reports/Echo/log/parseLogFile.jsonl'

describe('FilesService', () => {
  describe('getFilesPaths', () => {
    const directories = {
      '/logs': [
        entry('root.jsonl', 'file'),
        entry('notes.txt', 'file'),
        entry('docker', 'directory')
      ],
      [path.join('/logs', 'docker')]: [entry('compose.jsonl', 'file'), entry('utils', 'directory')],
      [path.join('/logs', 'docker', 'utils')]: [entry('backup.jsonl', 'file')]
    }

    it('should give the files of the directory at any depth', async () => {
      const filesService = createFilesService(buildFileSystem({ directories }))

      expect(await filesService.getFilesPaths('/logs', () => true)).toEqual([
        '/logs/root.jsonl',
        '/logs/notes.txt',
        '/logs/docker/compose.jsonl',
        '/logs/docker/utils/backup.jsonl'
      ])
    })

    it('should only give the files to include', async () => {
      const filesService = createFilesService(buildFileSystem({ directories }))

      expect(
        await filesService.getFilesPaths('/logs', (filePath) => filePath.endsWith('.txt'))
      ).toEqual(['/logs/notes.txt'])
    })

    it('should ignore the entries that are neither directories nor files', async () => {
      const filesService = createFilesService(
        buildFileSystem({ directories: { '/logs': [entry('socket.jsonl', 'other')] } })
      )

      expect(await filesService.getFilesPaths('/logs', () => true)).toEqual([])
    })

    it('should throw the error of the file system when the directory cannot be read', async () => {
      const filesService = createFilesService(
        buildFileSystem({
          overrides: { readdir: vi.fn().mockRejectedValue(new Error('ENOENT')) }
        })
      )

      await expect(filesService.getFilesPaths('/logs', () => true)).rejects.toThrow('ENOENT')
    })
  })

  describe('getFileLines', () => {
    it('should return the non-blank lines of the file in order', async () => {
      const fileSystem = buildFileSystem({ files: { [FILE_PATH]: 'foo\n\nbar\n  \n' } })

      expect(await createFilesService(fileSystem).getFileLines(FILE_PATH)).toEqual(['foo', 'bar'])
      expect(fileSystem.readFile).toHaveBeenCalledWith(FILE_PATH, 'utf-8')
    })

    it('should return no line when the file does not exist', async () => {
      const fileSystem = buildFileSystem({ missing: [FILE_PATH] })

      expect(await createFilesService(fileSystem).getFileLines(FILE_PATH)).toEqual([])
      expect(fileSystem.readFile).not.toHaveBeenCalled()
    })

    it('should throw the error of the file system when the file exists but is not readable', async () => {
      const fileSystem = buildFileSystem({ unreadable: [FILE_PATH] })

      await expect(createFilesService(fileSystem).getFileLines(FILE_PATH)).rejects.toThrow('EACCES')
      expect(fileSystem.readFile).not.toHaveBeenCalled()
    })

    it('should use the real file system by default', async () => {
      expect(await createFilesService().getFileLines('/does/not/exist/file.jsonl')).toEqual([])
    })
  })

  describe('createDirectory', () => {
    it('should create the directory and its parents', async () => {
      const fileSystem = buildFileSystem({})

      await createFilesService(fileSystem).createDirectory('/server_logs/self_reports/Echo/log')

      expect(fileSystem.mkdir).toHaveBeenCalledWith('/server_logs/self_reports/Echo/log', {
        recursive: true
      })
    })
  })

  describe('replaceFileLines', () => {
    it('should write the lines to a temporary file, then put it in place of the file', async () => {
      const steps: string[] = []
      const fileSystem = buildFileSystem({
        overrides: {
          writeFile: vi.fn(async () => {
            steps.push('writeFile')
          }),
          rename: vi.fn(async () => {
            steps.push('rename')
          })
        }
      })

      await createFilesService(fileSystem).replaceFileLines(FILE_PATH, ['foo', 'bar'])

      expect(fileSystem.writeFile).toHaveBeenCalledWith(`${FILE_PATH}.tmp`, 'foo\nbar\n', 'utf-8')
      expect(fileSystem.rename).toHaveBeenCalledWith(`${FILE_PATH}.tmp`, FILE_PATH)
      expect(steps).toEqual(['writeFile', 'rename'])
    })

    it('should empty the file when there is no line', async () => {
      const fileSystem = buildFileSystem({})

      await createFilesService(fileSystem).replaceFileLines(FILE_PATH, [])

      expect(fileSystem.writeFile).toHaveBeenCalledWith(`${FILE_PATH}.tmp`, '', 'utf-8')
    })
  })
})
