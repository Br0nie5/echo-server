import { constants as fsConstants } from 'fs'
import nodeFs from 'fs/promises'
import path from 'path'

import type { EchoError } from '@echo/utilities'

/** Access to the file system used to find and read the log files. */
export interface FilesService {
  getAllFilesPaths: (directory: string) => Promise<string[]>
  readFile: (filePath: string) => Promise<string[]>
  /** Base name of the file, without its directories nor its extension. */
  getFileNameWithoutExtension: (filePath: string) => string
}

/** The subset of `fs/promises` used, so it can be replaced in tests. */
export type FileSystem = Pick<typeof nodeFs, 'readdir' | 'access' | 'readFile'>

/** Builds the files service on top of `fileSystem` (the real file system by default). */
export const createFilesService = (fileSystem: FileSystem = nodeFs): FilesService => {
  const getAllFilesPaths = async (directory: string): Promise<string[]> => {
    let files: string[] = []

    const entries = await fileSystem.readdir(directory, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        files = files.concat(await getAllFilesPaths(fullPath))
      } else if (entry.isFile()) {
        files.push(fullPath)
      }
    }

    return files
  }

  return {
    getAllFilesPaths,

    readFile: async (filePath): Promise<string[]> => {
      await fileSystem.access(filePath, fsConstants.F_OK | fsConstants.R_OK).catch(() => {
        const error: EchoError = {
          statusCode: 500,
          message: `The file (${filePath}) does not exist or is not readable`
        }
        throw error
      })

      return (await fileSystem.readFile(filePath, 'utf-8'))
        .split('\n')
        .filter((line) => line.trim() !== '')
    },

    getFileNameWithoutExtension: (filePath): string =>
      path.basename(filePath, path.extname(filePath))
  }
}
