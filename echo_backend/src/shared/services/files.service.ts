import nodeFs from 'fs/promises'
import path from 'path'

import { FileDoesNotExistError } from './fileDoesNotExistError.js'

/**
 * Service reading and writing the files of the machine, as text or as lines of text.
 *
 * It is the one part of the backend's own code that reaches the file system (`arch:check` refuses
 * `fs` anywhere else), shared by whatever stores in files. Some libraries reach it on their own,
 * from a path the config gives them: `better-sqlite3` (the users database), `dotenv` (the
 * `.env.<mode>` file) and `@fastify/static` (the built frontend). It knows nothing of what the files hold nor
 * of how they are named: which files to look for is said by whoever asks.
 */
export interface FilesService {
  /** Creates the directory at `directoryPath`, and its parents, when they do not exist yet. */
  createDirectory: (directoryPath: string) => Promise<void>
  /**
   * The whole content of the file at `filePath`, as text.
   *
   * Throws a `FileDoesNotExistError` when the file does not exist, and the error of the file
   * system when it cannot be reached for another reason (a directory of its path that cannot be
   * searched or that is a file) or when it exists but cannot be read.
   *
   * ```ts
   * const lastCheckDate = JSON.parse(await filesService.getFileContent(lastLogsCheckFilePath))
   * ```
   */
  getFileContent: (filePath: string) => Promise<string>
  /**
   * The non-blank lines of the file at `filePath`, in the order they were written.
   *
   * Throws as `getFileContent` does: a `FileDoesNotExistError` when the file does not exist, and
   * the error of the file system when it cannot be reached or read.
   */
  getFileLines: (filePath: string) => Promise<string[]>
  /**
   * The paths of the files of `directoryPath`, at any depth, that `isFileIncluded` returns `true`
   * for.
   *
   * Throws when the directory, or one of the directories it holds, cannot be read.
   *
   * ```ts
   * const logFilesPaths = await filesService.getFilesPaths('/logs', (filePath) =>
   *   filePath.endsWith(logFileExtension)
   * )
   * ```
   */
  getFilesPaths: (
    directoryPath: string,
    isFileIncluded: (filePath: string) => boolean
  ) => Promise<string[]>
  /**
   * Makes `content` the whole content of the file at `filePath`.
   *
   * The file changes in one step: whoever reads it meanwhile gets either its previous content or
   * the new one, never a part of it. The writes of one file are done one after the other, in the
   * order they are asked for: a write waits for the previous one to end, and throws, writing
   * nothing, when it waits for longer than the timeout the service is built with. Throws when the
   * file cannot be written, the file then being left as it was.
   */
  replaceFileContent: (filePath: string, content: string) => Promise<void>
  /**
   * Makes `lines` the whole content of the file at `filePath`, one line each.
   *
   * The file changes in one step, after the previous write of the file, as with
   * `replaceFileContent`, and throws in the same cases.
   */
  replaceFileLines: (filePath: string, lines: string[]) => Promise<void>
  /**
   * Makes the file at `filePath` readable and writable by its owner only.
   *
   * Throws when the file does not exist or its permissions cannot be changed.
   */
  restrictFileAccessToOwner: (filePath: string) => Promise<void>
}

/** The subset of `fs/promises` used, so it can be replaced in tests. */
export type FileSystem = Pick<
  typeof nodeFs,
  'readdir' | 'readFile' | 'mkdir' | 'writeFile' | 'rename' | 'rm' | 'chmod'
>

/** How long a write waits for the previous write of the same file by default, in milliseconds. */
const DEFAULT_WRITE_WAIT_TIMEOUT_MILLISECONDS = 10_000

/**
 * Builds the files service, on top of `fileSystem` (the real file system by default).
 *
 * A write of a file waits for the previous write of that file to end for
 * `writeWaitTimeoutMilliseconds` at most (10 seconds by default). The writes are only queued within
 * this service: it is meant to be built once, when the server starts, and handed to whatever reads
 * or writes files, so that no two writes of a file overlap:
 *
 * ```ts
 * const filesService = createFilesService()
 * const lines = await filesService.getFileLines('/logs/backup/nightly.jsonl')
 * ```
 */
export const createFilesService = (
  fileSystem: FileSystem = nodeFs,
  writeWaitTimeoutMilliseconds: number = DEFAULT_WRITE_WAIT_TIMEOUT_MILLISECONDS
): FilesService => {
  /**
   * The promise of the last write asked for each file being written, which resolves when that write
   * and the ones before it end, failed or not: it never rejects.
   */
  const lastWritePromiseByFilePath = new Map<string, Promise<void>>()

  const getAllFilesPaths = async (directoryPath: string): Promise<string[]> => {
    const entries = await fileSystem.readdir(directoryPath, { withFileTypes: true })

    const filesPathsByEntry = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(directoryPath, entry.name)

        if (entry.isDirectory()) {
          return getAllFilesPaths(entryPath)
        }

        return entry.isFile() ? [entryPath] : []
      })
    )

    return filesPathsByEntry.flat()
  }

  const joinLines = (lines: string[]): string => lines.map((line) => `${line}\n`).join('')

  const getFileContent = async (filePath: string): Promise<string> => {
    try {
      return await fileSystem.readFile(filePath, 'utf-8')
    } catch (error) {
      throw (error as NodeJS.ErrnoException).code === 'ENOENT'
        ? new FileDoesNotExistError(filePath)
        : error
    }
  }

  const waitForPreviousWrite = (
    previousWritePromise: Promise<void>,
    filePath: string
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      const timeoutMessage =
        `The previous write of ${filePath} ` +
        `did not end within ${writeWaitTimeoutMilliseconds} ms`
      const timeout = setTimeout(
        () => reject(new Error(timeoutMessage)),
        writeWaitTimeoutMilliseconds
      )

      void previousWritePromise.then(() => {
        clearTimeout(timeout)
        resolve()
      })
    })

  const writeThroughTemporaryFile = async (filePath: string, content: string): Promise<void> => {
    // The files are read at any time: writing into the file itself would let a reader see it
    // half written, and take its cut line for a line of its own.
    const temporaryFilePath = `${filePath}.tmp`

    try {
      await fileSystem.writeFile(temporaryFilePath, content, 'utf-8')
      await fileSystem.rename(temporaryFilePath, filePath)
    } catch (error) {
      // The error of the write is the one to report: a temporary file that cannot be removed
      // either is left behind, and replaced on the next write.
      await fileSystem.rm(temporaryFilePath, { force: true }).catch(() => undefined)
      throw error
    }
  }

  const replaceFileContent = (filePath: string, content: string): Promise<void> => {
    const previousWritePromise = lastWritePromiseByFilePath.get(filePath)

    const newWritePromise = (
      previousWritePromise
        ? waitForPreviousWrite(previousWritePromise, filePath)
        : Promise.resolve()
    ).then(() => writeThroughTemporaryFile(filePath, content))

    // `newWritePromise` stops waiting for the previous write at the timeout, while that write may
    // still be going on: the next write waits for both, so it never shares the temporary file with
    // a write that is still going on.
    const writePromises = Promise.all([
      previousWritePromise,
      newWritePromise.catch(() => undefined)
    ]).then(() => undefined)

    lastWritePromiseByFilePath.set(filePath, writePromises)

    void writePromises.then(() => {
      if (lastWritePromiseByFilePath.get(filePath) === writePromises) {
        lastWritePromiseByFilePath.delete(filePath)
      }
    })

    return newWritePromise
  }

  return {
    createDirectory: async (directoryPath): Promise<void> => {
      await fileSystem.mkdir(directoryPath, { recursive: true })
    },

    getFileContent,

    getFileLines: async (filePath): Promise<string[]> =>
      (await getFileContent(filePath)).split('\n').filter((line) => line.trim() !== ''),

    getFilesPaths: async (directoryPath, isFileIncluded): Promise<string[]> =>
      (await getAllFilesPaths(directoryPath)).filter(isFileIncluded),

    replaceFileContent,

    replaceFileLines: (filePath, lines): Promise<void> =>
      replaceFileContent(filePath, joinLines(lines)),

    restrictFileAccessToOwner: async (filePath): Promise<void> => {
      await fileSystem.chmod(filePath, 0o600)
    }
  }
}
