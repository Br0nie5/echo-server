import path from 'path'

import type { FileSystem } from '../../shared/services/files.service.js'

/** A file system kept in memory, with what a test needs to fill it and to read it back. */
export interface InMemoryFileSystem {
  /** What to build the files service with: `createFilesService(inMemoryFileSystem.fileSystem)`. */
  fileSystem: FileSystem
  /** The content of the file at `filePath`, or `undefined` when there is none. */
  getFile: (filePath: string) => string | undefined
  /** Makes `content` the content of the file at `filePath`, creating its directories. */
  setFile: (filePath: string, content: string) => void
  /** The paths of every file, in the order they were created. */
  getFilesPaths: () => string[]
  /** The permissions the file at `filePath` was given, or `undefined` when none were. */
  getFileMode: (filePath: string) => number | undefined
}

/** An entry of a directory, as the files service reads it. */
interface InMemoryEntry {
  name: string
  isDirectory: () => boolean
  isFile: () => boolean
}

/** The error the file system of Node.js throws for a path that does not exist. */
const createDoesNotExistError = (missingPath: string): NodeJS.ErrnoException =>
  Object.assign(new Error(`ENOENT: no such file or directory, '${missingPath}'`), {
    code: 'ENOENT'
  })

/**
 * Builds a file system that keeps its files in memory, so a test reaches no disk.
 *
 * It starts with `files`, each path given its content, and with the empty `directories`. It
 * behaves like the one of Node.js for what the files service uses: a file or a directory that does
 * not exist is an `ENOENT` error, a file is only written in a directory that exists, the `a` flag
 * of a write appends to the file, and the `mode` of a write is given to the file it creates.
 *
 * ```ts
 * const inMemoryFileSystem = createInMemoryFileSystem({
 *   files: { '/logs/billing/logs/send_invoices.jsonl': '{"jobId":1,...}\n' }
 * })
 * const filesService = createFilesService(inMemoryFileSystem.fileSystem)
 *
 * await filesService.replaceFileContent('/data/session.json', '{}')
 * inMemoryFileSystem.getFile('/data/session.json') // '{}'
 * ```
 */
export const createInMemoryFileSystem = ({
  files: initialFiles = {},
  directories: initialDirectories = []
}: {
  files?: Record<string, string>
  directories?: string[]
} = {}): InMemoryFileSystem => {
  const files = new Map<string, string>()
  const directories = new Set<string>()
  const fileModes = new Map<string, number>()

  const createDirectory = (directoryPath: string): void => {
    let currentPath = path.resolve('/', directoryPath)

    while (!directories.has(currentPath)) {
      directories.add(currentPath)
      currentPath = path.dirname(currentPath)
    }
  }

  const setFile = (filePath: string, content: string): void => {
    createDirectory(path.dirname(filePath))
    files.set(path.resolve('/', filePath), content)
  }

  const getExistingFile = (filePath: string): string => {
    const content = files.get(path.resolve('/', filePath))

    if (content === undefined) {
      throw createDoesNotExistError(filePath)
    }

    return content
  }

  initialDirectories.forEach(createDirectory)
  Object.entries(initialFiles).forEach(([filePath, content]) => setFile(filePath, content))

  const fileSystem = {
    readdir: async (directoryPath: string): Promise<InMemoryEntry[]> => {
      const resolvedDirectoryPath = path.resolve('/', directoryPath)

      if (!directories.has(resolvedDirectoryPath)) {
        throw createDoesNotExistError(directoryPath)
      }

      const isDirectChild = (entryPath: string): boolean =>
        entryPath !== resolvedDirectoryPath && path.dirname(entryPath) === resolvedDirectoryPath

      return [
        ...[...directories].filter(isDirectChild).map((entryPath) => ({
          name: path.basename(entryPath),
          isDirectory: (): boolean => true,
          isFile: (): boolean => false
        })),
        ...[...files.keys()].filter(isDirectChild).map((entryPath) => ({
          name: path.basename(entryPath),
          isDirectory: (): boolean => false,
          isFile: (): boolean => true
        }))
      ]
    },

    readFile: async (filePath: string): Promise<string> => getExistingFile(filePath),

    mkdir: async (directoryPath: string): Promise<void> => {
      createDirectory(directoryPath)
    },

    writeFile: async (
      filePath: string,
      content: string,
      options?: BufferEncoding | { flag?: string; mode?: number }
    ): Promise<void> => {
      const resolvedFilePath = path.resolve('/', filePath)

      if (!directories.has(path.dirname(resolvedFilePath))) {
        throw createDoesNotExistError(filePath)
      }

      const { flag, mode } = typeof options === 'object' ? options : {}
      const previousContent = files.get(resolvedFilePath)

      if (previousContent === undefined && mode !== undefined) {
        fileModes.set(resolvedFilePath, mode)
      }

      files.set(resolvedFilePath, flag === 'a' ? `${previousContent ?? ''}${content}` : content)
    },

    rename: async (oldPath: string, newPath: string): Promise<void> => {
      const content = getExistingFile(oldPath)

      files.delete(path.resolve('/', oldPath))
      files.set(path.resolve('/', newPath), content)
    },

    rm: async (filePath: string): Promise<void> => {
      files.delete(path.resolve('/', filePath))
    },

    chmod: async (filePath: string, mode: number): Promise<void> => {
      getExistingFile(filePath)
      fileModes.set(path.resolve('/', filePath), mode)
    }
  }

  return {
    // The functions of `fs/promises` have many overloads, of which the files service calls one
    // each: only those are written here.
    fileSystem: fileSystem as unknown as FileSystem,
    getFile: (filePath) => files.get(path.resolve('/', filePath)),
    setFile,
    getFilesPaths: () => [...files.keys()],
    getFileMode: (filePath) => fileModes.get(path.resolve('/', filePath))
  }
}
