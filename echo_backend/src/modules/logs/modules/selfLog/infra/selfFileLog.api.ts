import nodeFs from 'fs/promises'
import path from 'path'

/** Access to the self-log files, the data source the self logs are stored in. */
export interface SelfFileLogApi {
  /** Creates the self-logs directory, and its parents, when they do not exist yet. */
  createSelfLogsDirectory: () => Promise<void>
  /**
   * The non-blank lines of the self-log file named `fileName`, in the order they were written.
   *
   * A file that does not exist yet has no line. Throws when the file exists but cannot be read.
   */
  getRawSelfLogLines: (fileName: string) => Promise<string[]>
  /**
   * Makes `rawSelfLogLines` the whole content of the self-log file named `fileName`.
   *
   * The file changes in one step: whoever reads it meanwhile gets either its previous content or
   * the new one, never a part of it.
   */
  replaceRawSelfLogLines: (fileName: string, rawSelfLogLines: string[]) => Promise<void>
  /**
   * Removes from the self-log file named `fileName` every line equal to one of `rawSelfLogLines`.
   *
   * The file changes in one step, like with `replaceRawSelfLogLines`, and is left untouched when
   * `rawSelfLogLines` is empty.
   */
  deleteRawSelfLogLines: (fileName: string, rawSelfLogLines: string[]) => Promise<void>
  /** Adds `rawSelfLogLines` at the end of the self-log file named `fileName`, in a single write. */
  appendRawSelfLogLines: (fileName: string, rawSelfLogLines: string[]) => Promise<void>
}

/** The subset of `fs/promises` used, so it can be replaced in tests. */
export type SelfLogFileSystem = Pick<
  typeof nodeFs,
  'mkdir' | 'readFile' | 'writeFile' | 'rename' | 'appendFile'
>

/**
 * Builds the access to the self-log files of the server named `serverName`, on top of `fileSystem`
 * (the real file system by default).
 *
 * The files live in `<logsDirPath>/server/<serverName>/log`, inside the logs directory, so the self
 * logs are read back like any other log. In that path, every character of `serverName` other than
 * a letter, a digit, `-`, `_` or a space is replaced with `_`.
 */
export const createSelfFileLogApi = (
  logsDirPath: string,
  serverName: string,
  fileSystem: SelfLogFileSystem = nodeFs
): SelfFileLogApi => {
  // SERVER_NAME is a free-text display value, not a path-safe identifier: `/` and `..` would
  // otherwise move the self logs out of their directory.
  const serverDirectoryName = serverName.replace(/[^a-zA-Z0-9-_ ]/g, '_')
  const selfLogsDirPath = path.join(logsDirPath, 'server', serverDirectoryName, 'log')

  const getSelfLogFilePath = (fileName: string): string => path.join(selfLogsDirPath, fileName)

  const joinLines = (lines: string[]): string => lines.map((line) => `${line}\n`).join('')

  const getRawSelfLogLines = async (fileName: string): Promise<string[]> => {
    const content = await fileSystem
      .readFile(getSelfLogFilePath(fileName), 'utf-8')
      .catch((error: unknown) => {
        const isMissingFileError =
          error instanceof Error && 'code' in error && error.code === 'ENOENT'
        if (isMissingFileError) {
          return ''
        }

        throw error
      })

    return content.split('\n').filter((line) => line.trim() !== '')
  }

  const replaceRawSelfLogLines = async (
    fileName: string,
    rawSelfLogLines: string[]
  ): Promise<void> => {
    const selfLogFilePath = getSelfLogFilePath(fileName)
    // The self-log files are read back as logs at any time: writing into the file itself would
    // let a reader see it half written, and report its cut line as a line it cannot parse.
    const temporaryFilePath = `${selfLogFilePath}.tmp`

    await fileSystem.writeFile(temporaryFilePath, joinLines(rawSelfLogLines), 'utf-8')
    await fileSystem.rename(temporaryFilePath, selfLogFilePath)
  }

  return {
    createSelfLogsDirectory: async (): Promise<void> => {
      await fileSystem.mkdir(selfLogsDirPath, { recursive: true })
    },

    getRawSelfLogLines,

    replaceRawSelfLogLines,

    deleteRawSelfLogLines: async (fileName, rawSelfLogLines): Promise<void> => {
      if (rawSelfLogLines.length === 0) {
        return
      }

      const remainingRawSelfLogLines = (await getRawSelfLogLines(fileName)).filter(
        (rawSelfLogLine) => !rawSelfLogLines.includes(rawSelfLogLine)
      )

      await replaceRawSelfLogLines(fileName, remainingRawSelfLogLines)
    },

    appendRawSelfLogLines: (fileName, rawSelfLogLines): Promise<void> =>
      fileSystem.appendFile(getSelfLogFilePath(fileName), joinLines(rawSelfLogLines), 'utf-8')
  }
}
