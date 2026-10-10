import nodeFs from 'fs/promises'
import path from 'path'

import { afterEach, describe, it, expect, vi } from 'vitest'

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
    readFile: vi.fn(async (filePath: string) => {
      if (missing.includes(filePath)) {
        throw fileSystemError('ENOENT')
      }
      if (unreachable.includes(filePath)) {
        throw fileSystemError('ENOTDIR')
      }
      if (unreadable.includes(filePath)) {
        throw fileSystemError('EACCES')
      }
      return files[filePath]
    }),
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
  it('Should use the file system of Node.js by default', async () => {
    await createFilesService().createDirectory('/server_logs')

    expect(nodeFs.mkdir).toHaveBeenCalledWith('/server_logs', { recursive: true })
  })

  describe('createDirectory', () => {
    it('Should create the directory and its parents', async () => {
      const fileSystem = buildFileSystem({})

      await createFilesService(fileSystem).createDirectory('/server_logs/self_reports/Echo/log')

      expect(fileSystem.mkdir).toHaveBeenCalledWith('/server_logs/self_reports/Echo/log', {
        recursive: true
      })
    })
  })

  describe('getFileContent', () => {
    it('Should return the whole content of the file', async () => {
      const fileSystem = buildFileSystem({ files: { [FILE_PATH]: 'foo\n\nbar\n' } })

      expect(await createFilesService(fileSystem).getFileContent(FILE_PATH)).toBe('foo\n\nbar\n')
      expect(fileSystem.readFile).toHaveBeenCalledWith(FILE_PATH, 'utf-8')
    })

    it('Should throw a FileDoesNotExistError when the file does not exist', async () => {
      const fileSystem = buildFileSystem({ missing: [FILE_PATH] })

      await expect(createFilesService(fileSystem).getFileContent(FILE_PATH)).rejects.toThrow(
        new FileDoesNotExistError(FILE_PATH)
      )
    })

    it('Should throw the error of the file system when the file cannot be reached for another reason', async () => {
      const fileSystem = buildFileSystem({ unreachable: [FILE_PATH] })

      await expect(createFilesService(fileSystem).getFileContent(FILE_PATH)).rejects.toThrow(
        'ENOTDIR'
      )
    })

    it('Should throw the error of the file system when the file exists but is not readable', async () => {
      const fileSystem = buildFileSystem({ unreadable: [FILE_PATH] })

      await expect(createFilesService(fileSystem).getFileContent(FILE_PATH)).rejects.toThrow(
        'EACCES'
      )
    })
  })

  describe('getFileLines', () => {
    it('Should return the non-blank lines of the file in order', async () => {
      const fileSystem = buildFileSystem({ files: { [FILE_PATH]: 'foo\n\nbar\n  \n' } })

      expect(await createFilesService(fileSystem).getFileLines(FILE_PATH)).toEqual(['foo', 'bar'])
    })

    it('Should throw a FileDoesNotExistError when the file does not exist', async () => {
      const fileSystem = buildFileSystem({ missing: [FILE_PATH] })

      await expect(createFilesService(fileSystem).getFileLines(FILE_PATH)).rejects.toBeInstanceOf(
        FileDoesNotExistError
      )
    })

    it('Should throw the error of the file system when the file exists but is not readable', async () => {
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

    it('Should give the files of the directory at any depth', async () => {
      const filesService = createFilesService(buildFileSystem({ directories }))

      expect(await filesService.getFilesPaths('/logs', () => true)).toEqual([
        '/logs/root.jsonl',
        '/logs/notes.txt',
        '/logs/docker/compose.jsonl',
        '/logs/docker/utils/backup.jsonl'
      ])
    })

    it('Should only give the files to include', async () => {
      const filesService = createFilesService(buildFileSystem({ directories }))

      expect(
        await filesService.getFilesPaths('/logs', (filePath) => filePath.endsWith('.txt'))
      ).toEqual(['/logs/notes.txt'])
    })

    it('Should ignore the entries that are neither directories nor files', async () => {
      const filesService = createFilesService(
        buildFileSystem({ directories: { '/logs': [entry('socket.jsonl', 'other')] } })
      )

      expect(await filesService.getFilesPaths('/logs', () => true)).toEqual([])
    })

    it('Should throw the error of the file system when the directory cannot be read', async () => {
      const filesService = createFilesService(
        buildFileSystem({
          overrides: { readdir: vi.fn().mockRejectedValue(new Error('ENOENT')) }
        })
      )

      await expect(filesService.getFilesPaths('/logs', () => true)).rejects.toThrow('ENOENT')
    })
  })

  describe('replaceFileContent', () => {
    it('Should write the content to a temporary file, then put it in place of the file', async () => {
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

    it('Should remove the temporary file and throw the error when it cannot be written', async () => {
      const { fileSystem, steps } = buildRecordingFileSystem({
        writeFile: vi.fn().mockRejectedValue(new Error('ENOSPC'))
      })

      await expect(
        createFilesService(fileSystem).replaceFileContent(FILE_PATH, 'content')
      ).rejects.toThrow('ENOSPC')
      expect(fileSystem.rm).toHaveBeenCalledWith(TEMPORARY_FILE_PATH, { force: true })
      expect(steps).toEqual(['rm'])
    })

    it('Should remove the temporary file and throw the error when it cannot be put in place', async () => {
      const { fileSystem, steps } = buildRecordingFileSystem({
        rename: vi.fn().mockRejectedValue(new Error('EXDEV'))
      })

      await expect(
        createFilesService(fileSystem).replaceFileContent(FILE_PATH, 'content')
      ).rejects.toThrow('EXDEV')
      expect(fileSystem.rm).toHaveBeenCalledWith(TEMPORARY_FILE_PATH, { force: true })
      expect(steps).toEqual(['writeFile', 'rm'])
    })

    it('Should throw the error of the write, not the one of the removal, when both fail', async () => {
      const { fileSystem } = buildRecordingFileSystem({
        rename: vi.fn().mockRejectedValue(new Error('EXDEV')),
        rm: vi.fn().mockRejectedValue(new Error('EACCES'))
      })

      await expect(
        createFilesService(fileSystem).replaceFileContent(FILE_PATH, 'content')
      ).rejects.toThrow('EXDEV')
    })
  })

  describe('the writes of a file', () => {
    /** A promise to resolve by hand, to hold a write of the file system until the test lets it go. */
    const createDeferred = (): { promise: Promise<void>; resolve: () => void } => {
      let resolve: () => void = () => undefined
      const promise = new Promise<void>((resolvePromise) => {
        resolve = resolvePromise
      })
      return { promise, resolve }
    }

    afterEach(() => {
      vi.useRealTimers()
    })

    it('Should wait for the previous write of the same file to end before writing', async () => {
      const firstWriteFile = createDeferred()
      const { fileSystem, steps } = buildRecordingFileSystem({
        writeFile: vi.fn(async (_filePath, content) => {
          if (content === 'first') {
            await firstWriteFile.promise
          }
          steps.push(`writeFile ${content}`)
        })
      })
      const filesService = createFilesService(fileSystem)

      const firstWrite = filesService.replaceFileContent(FILE_PATH, 'first')
      const secondWrite = filesService.replaceFileLines(FILE_PATH, ['second'])
      await vi.waitFor(() => expect(fileSystem.writeFile).toHaveBeenCalledTimes(1))
      firstWriteFile.resolve()
      await Promise.all([firstWrite, secondWrite])

      expect(steps).toEqual(['writeFile first', 'rename', 'writeFile second\n', 'rename'])
    })

    it('Should not make the writes of other files wait', async () => {
      const firstWriteFile = createDeferred()
      const { fileSystem } = buildRecordingFileSystem({
        writeFile: vi.fn(async (filePath) => {
          if (filePath === TEMPORARY_FILE_PATH) {
            await firstWriteFile.promise
          }
        })
      })
      const filesService = createFilesService(fileSystem)

      const firstWrite = filesService.replaceFileContent(FILE_PATH, 'first')
      await filesService.replaceFileContent('/data/other.json', 'other')

      expect(fileSystem.rename).toHaveBeenCalledWith('/data/other.json.tmp', '/data/other.json')
      firstWriteFile.resolve()
      await firstWrite
    })

    it('Should write after a previous write that failed', async () => {
      const { fileSystem } = buildRecordingFileSystem({
        writeFile: vi.fn().mockRejectedValueOnce(new Error('ENOSPC')).mockResolvedValue(undefined)
      })
      const filesService = createFilesService(fileSystem)

      const firstWrite = filesService.replaceFileContent(FILE_PATH, 'first')
      const secondWrite = filesService.replaceFileContent(FILE_PATH, 'second')

      await expect(firstWrite).rejects.toThrow('ENOSPC')
      await secondWrite
      expect(fileSystem.rename).toHaveBeenCalledOnce()
    })

    it('Should throw without writing when the previous write does not end within the timeout', async () => {
      vi.useFakeTimers()
      const stuckWriteFile = createDeferred()
      const { fileSystem } = buildRecordingFileSystem({
        writeFile: vi.fn(() => stuckWriteFile.promise)
      })
      const filesService = createFilesService(fileSystem, 1000)

      const stuckWrite = filesService.replaceFileContent(FILE_PATH, 'stuck')
      const waitingWrite = filesService.replaceFileContent(FILE_PATH, 'waiting')
      const waitingWriteResult = expect(waitingWrite).rejects.toThrow(
        `The previous write of ${FILE_PATH} did not end within 1000 ms`
      )
      await vi.advanceTimersByTimeAsync(1000)

      await waitingWriteResult
      expect(fileSystem.writeFile).toHaveBeenCalledOnce()
      stuckWriteFile.resolve()
      await stuckWrite
    })

    it('Should make a write wait for the one still going on, even after a write that gave up waiting', async () => {
      vi.useFakeTimers()
      const stuckWriteFile = createDeferred()
      const { fileSystem, steps } = buildRecordingFileSystem({
        writeFile: vi.fn(async (_filePath, content) => {
          if (content === 'stuck') {
            await stuckWriteFile.promise
          }
          steps.push(`writeFile ${content}`)
        })
      })
      const filesService = createFilesService(fileSystem, 1000)

      const stuckWrite = filesService.replaceFileContent(FILE_PATH, 'stuck')
      const gaveUpWrite = filesService
        .replaceFileContent(FILE_PATH, 'gave up')
        .catch(() => undefined)
      await vi.advanceTimersByTimeAsync(1000)
      await gaveUpWrite
      const nextWrite = filesService.replaceFileContent(FILE_PATH, 'next')
      await vi.advanceTimersByTimeAsync(500)
      stuckWriteFile.resolve()
      await Promise.all([stuckWrite, nextWrite])

      expect(steps).toEqual(['writeFile stuck', 'rename', 'writeFile next', 'rename'])
    })
  })

  describe('replaceFileLines', () => {
    it('Should write the lines, one each, through a temporary file', async () => {
      const { fileSystem, steps } = buildRecordingFileSystem()

      await createFilesService(fileSystem).replaceFileLines(FILE_PATH, ['foo', 'bar'])

      expect(fileSystem.writeFile).toHaveBeenCalledWith(TEMPORARY_FILE_PATH, 'foo\nbar\n', 'utf-8')
      expect(fileSystem.rename).toHaveBeenCalledWith(TEMPORARY_FILE_PATH, FILE_PATH)
      expect(steps).toEqual(['writeFile', 'rename'])
    })

    it('Should empty the file when there is no line', async () => {
      const fileSystem = buildFileSystem({})

      await createFilesService(fileSystem).replaceFileLines(FILE_PATH, [])

      expect(fileSystem.writeFile).toHaveBeenCalledWith(TEMPORARY_FILE_PATH, '', 'utf-8')
    })
  })

  describe('restrictFileAccessToOwner', () => {
    it('Should make the file readable and writable by its owner only', async () => {
      const fileSystem = buildFileSystem({})

      await createFilesService(fileSystem).restrictFileAccessToOwner(FILE_PATH)

      expect(fileSystem.chmod).toHaveBeenCalledWith(FILE_PATH, 0o600)
    })
  })
})
