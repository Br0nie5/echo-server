import { constants as fsConstants } from 'fs'
import nodeFs from 'fs/promises'
import path from 'path'

/**
 * Service reading and writing the files of the machine, as lines of text.
 *
 * It is shared by the modules that store in files. It knows nothing of what the files hold nor of
 * how they are named: which files to look for is said by whoever asks.
 */
export interface FilesService {
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
   * The non-blank lines of the file at `filePath`, in the order they were written.
   *
   * A file that does not exist has no line. Throws when the file exists but cannot be read.
   */
  getFileLines: (filePath: string) => Promise<string[]>
  /** Creates the directory at `directoryPath`, and its parents, when they do not exist yet. */
  createDirectory: (directoryPath: string) => Promise<void>
  /**
   * Makes `lines` the whole content of the file at `filePath`, one line each.
   *
   * The file changes in one step: whoever reads it meanwhile gets either its previous content or
   * the new one, never a part of it. Throws when the file cannot be written.
   */
  replaceFileLines: (filePath: string, lines: string[]) => Promise<void>
}

/** The subset of `fs/promises` used, so it can be replaced in tests. */
export type FileSystem = Pick<
  typeof nodeFs,
  'readdir' | 'access' | 'readFile' | 'mkdir' | 'writeFile' | 'rename'
>

/**
 * Builds the files service, on top of `fileSystem` (the real file system by default).
 *
 * ```ts
 * const filesService = createFilesService()
 * const lines = await filesService.getFileLines('/logs/backup/nightly.jsonl')
 * ```
 */
export const createFilesService = (fileSystem: FileSystem = nodeFs): FilesService => {
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

  return {
    getFilesPaths: async (directoryPath, isFileIncluded): Promise<string[]> =>
      (await getAllFilesPaths(directoryPath)).filter(isFileIncluded),

    getFileLines: async (filePath): Promise<string[]> => {
      const doesFileExist = await fileSystem.access(filePath, fsConstants.F_OK).then(
        () => true,
        () => false
      )
      if (!doesFileExist) {
        return []
      }

      await fileSystem.access(filePath, fsConstants.R_OK)

      const content = await fileSystem.readFile(filePath, 'utf-8')

      return content.split('\n').filter((line) => line.trim() !== '')
    },

    createDirectory: async (directoryPath): Promise<void> => {
      await fileSystem.mkdir(directoryPath, { recursive: true })
    },

    replaceFileLines: async (filePath, lines): Promise<void> => {
      // The files are read at any time: writing into the file itself would let a reader see it
      // half written, and take its cut line for a line of its own.
      const temporaryFilePath = `${filePath}.tmp`

      await fileSystem.writeFile(temporaryFilePath, joinLines(lines), 'utf-8')
      await fileSystem.rename(temporaryFilePath, filePath)
    }
  }
}
