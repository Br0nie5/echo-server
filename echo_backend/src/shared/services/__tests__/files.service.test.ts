import { constants as fsConstants } from 'fs'
import nodeFs from 'fs/promises'
import path from 'path'

import { describe, it, expect, vi } from 'vitest'

vi.mock('fs/promises', () => ({ default: { mkdir: vi.fn() } }))

import { FileDoesNotExistError } from '../fileDoesNotExistError.js'
import { createFilesService, type FileSystem } from '../files.service.js'

const entry = (name: string, type: 'file' | 'directory' | 'other'): object => ({
  name,
  isFile: (): boolean => type === 'file',
  isDirectory: (): boolean => type === 'directory'
})

/** An error of the file system, with its `code`, as Node.js throws them. */
const fileSystemError = (code: string): NodeJS.ErrnoException =>
  Object.assign(new Error(code), { code })

const buildFileSystem = ({
  directories = {},
  files = {},
  missing = [],
  unreachable = [],
  unreadable = [],
  overrides = {}
}: {
  directories?: Record<string, object[]>
  files?: Record<string, string>
  missing?: string[]
  /** Files whose path goes through something that is not a directory. */
  unreachable?: string[]
  unreadable?: string[]
  overrides?: Partial<FileSystem>
}): FileSystem =>
  ({
    readdir: vi.fn(async (directory: string) => directories[directory]),
    access: vi.fn(async (filePath: string, mode: number) => {
      if (missing.includes(filePath)) {
        throw fileSystemError('ENOENT')
      }
      if (unreachable.includes(filePath)) {
        throw fileSystemError('ENOTDIR')
      }
      if (unreadable.includes(filePath) && mode === fsConstants.R_OK) {
        throw fileSystemError('EACCES')
      }
    }),
    readFile: vi.fn(async (filePath: string) => files[filePath]),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    rename: vi.fn(),
    rm: vi.fn(),
    chmod: vi.fn(),
    ...overrides
  }) as unknown as FileSystem

/** A file system recording, in `steps`, the writes, renames and removals it is asked for. */
const buildRecordingFileSystem = (
  overrides: Partial<FileSystem> = {}
): { fileSystem: FileSystem; steps: string[] } => {
  const steps: string[] = []
  const fileSystem = buildFileSystem({
    overrides: {
      writeFile: vi.fn(async () => {
        steps.push('writeFile')
      }),
      rename: vi.fn(async () => {
        steps.push('rename')
      }),
      rm: vi.fn(async () => {
        steps.push('rm')
      }),
      ...overrides
    }
  })

  return { fileSystem, steps }
}

const FILE_PATH = '/server_logs/self_reports/Echo/log/parseLogFile.jsonl'
const TEMPORARY_FILE_PATH = `${FILE_PATH}.tmp`

describe('FilesService', () => {
  it('should use the file system of Node.js by default', async () => {
    await createFilesService().createDirectory('/server_logs')

    expect(nodeFs.mkdir).toHaveBeenCalledWith('/server_logs', { recursive: true })
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

  describe('getFileContent', () => {
    it('should return the whole content of the file', async () => {
      const fileSystem = buildFileSystem({ files: { [FILE_PATH]: 'foo\n\nbar\n' } })

      expect(await createFilesService(fileSystem).getFileContent(FILE_PATH)).toBe('foo\n\nbar\n')
      expect(fileSystem.readFile).toHaveBeenCalledWith(FILE_PATH, 'utf-8')
    })

    it('should throw a FileDoesNotExistError when the file does not exist', async () => {
      const fileSystem = buildFileSystem({ missing: [FILE_PATH] })

      await expect(createFilesService(fileSystem).getFileContent(FILE_PATH)).rejects.toThrow(
        new FileDoesNotExistError(FILE_PATH)
      )
      expect(fileSystem.readFile).not.toHaveBeenCalled()
    })

    it('should throw the error of the file system when the file cannot be reached for another reason', async () => {
      const fileSystem = buildFileSystem({ unreachable: [FILE_PATH] })

      await expect(createFilesService(fileSystem).getFileContent(FILE_PATH)).rejects.toThrow(
        'ENOTDIR'
      )
      expect(fileSystem.readFile).not.toHaveBeenCalled()
    })

    it('should throw the error of the file system when the file exists but is not readable', async () => {
      const fileSystem = buildFileSystem({ unreadable: [FILE_PATH] })

      await expect(createFilesService(fileSystem).getFileContent(FILE_PATH)).rejects.toThrow(
        'EACCES'
      )
      expect(fileSystem.readFile).not.toHaveBeenCalled()
    })
  })

  describe('getFileLines', () => {
    it('should return the non-blank lines of the file in order', async () => {
      const fileSystem = buildFileSystem({ files: { [FILE_PATH]: 'foo\n\nbar\n  \n' } })

      expect(await createFilesService(fileSystem).getFileLines(FILE_PATH)).toEqual(['foo', 'bar'])
    })

    it('should throw a FileDoesNotExistError when the file does not exist', async () => {
      const fileSystem = buildFileSystem({ missing: [FILE_PATH] })

      await expect(createFilesService(fileSystem).getFileLines(FILE_PATH)).rejects.toBeInstanceOf(
        FileDoesNotExistError
      )
    })

    it('should throw the error of the file system when the file exists but is not readable', async () => {
      const fileSystem = buildFileSystem({ unreadable: [FILE_PATH] })

      await expect(createFilesService(fileSystem).getFileLines(FILE_PATH)).rejects.toThrow('EACCES')
    })
  })

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

  describe('replaceFileContent', () => {
    it('should write the content to a temporary file, then put it in place of the file', async () => {
      const { fileSystem, steps } = buildRecordingFileSystem()

      await createFilesService(fileSystem).replaceFileContent(FILE_PATH, '{"lastJobId":7}')

      expect(fileSystem.writeFile).toHaveBeenCalledWith(
        TEMPORARY_FILE_PATH,
        '{"lastJobId":7}',
        'utf-8'
      )
      expect(fileSystem.rename).toHaveBeenCalledWith(TEMPORARY_FILE_PATH, FILE_PATH)
      expect(steps).toEqual(['writeFile', 'rename'])
    })

    it('should remove the temporary file and throw the error when it cannot be written', async () => {
      const { fileSystem, steps } = buildRecordingFileSystem({
        writeFile: vi.fn().mockRejectedValue(new Error('ENOSPC'))
      })

      await expect(
        createFilesService(fileSystem).replaceFileContent(FILE_PATH, 'content')
      ).rejects.toThrow('ENOSPC')
      expect(fileSystem.rm).toHaveBeenCalledWith(TEMPORARY_FILE_PATH, { force: true })
      expect(steps).toEqual(['rm'])
    })

    it('should remove the temporary file and throw the error when it cannot be put in place', async () => {
      const { fileSystem, steps } = buildRecordingFileSystem({
        rename: vi.fn().mockRejectedValue(new Error('EXDEV'))
      })

      await expect(
        createFilesService(fileSystem).replaceFileContent(FILE_PATH, 'content')
      ).rejects.toThrow('EXDEV')
      expect(fileSystem.rm).toHaveBeenCalledWith(TEMPORARY_FILE_PATH, { force: true })
      expect(steps).toEqual(['writeFile', 'rm'])
    })

    it('should throw the error of the write, not the one of the removal, when both fail', async () => {
      const { fileSystem } = buildRecordingFileSystem({
        rename: vi.fn().mockRejectedValue(new Error('EXDEV')),
        rm: vi.fn().mockRejectedValue(new Error('EACCES'))
      })

      await expect(
        createFilesService(fileSystem).replaceFileContent(FILE_PATH, 'content')
      ).rejects.toThrow('EXDEV')
    })
  })

  describe('replaceFileLines', () => {
    it('should write the lines, one each, through a temporary file', async () => {
      const { fileSystem, steps } = buildRecordingFileSystem()

      await createFilesService(fileSystem).replaceFileLines(FILE_PATH, ['foo', 'bar'])

      expect(fileSystem.writeFile).toHaveBeenCalledWith(TEMPORARY_FILE_PATH, 'foo\nbar\n', 'utf-8')
      expect(fileSystem.rename).toHaveBeenCalledWith(TEMPORARY_FILE_PATH, FILE_PATH)
      expect(steps).toEqual(['writeFile', 'rename'])
    })

    it('should empty the file when there is no line', async () => {
      const fileSystem = buildFileSystem({})

      await createFilesService(fileSystem).replaceFileLines(FILE_PATH, [])

      expect(fileSystem.writeFile).toHaveBeenCalledWith(TEMPORARY_FILE_PATH, '', 'utf-8')
    })
  })

  describe('restrictFileAccessToOwner', () => {
    it('should make the file readable and writable by its owner only', async () => {
      const fileSystem = buildFileSystem({})

      await createFilesService(fileSystem).restrictFileAccessToOwner(FILE_PATH)

      expect(fileSystem.chmod).toHaveBeenCalledWith(FILE_PATH, 0o600)
    })
  })
})
