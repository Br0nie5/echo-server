import type { Log } from '@echo/utilities'

import type { FilesService } from '../../shared/services/files.service.js'

import type { SelfLogsWriter } from './selfLogs/selfLogs.writer.js'
import { parseLogFile } from './utils/parseLogFile.js'

/** Storage of the logs. */
export interface LogsRepository {
  /** Every stored log entry, unordered. */
  findAll: () => Promise<Log[]>
}

/** Reads the logs from the `.jsonl` files found under `logsDirPath`. */
export const createFileLogsRepository = (
  logsDirPath: string,
  filesService: FilesService,
  selfLogsWriter: SelfLogsWriter
): LogsRepository => ({
  findAll: async (): Promise<Log[]> => {
    const logFilesPaths = (await filesService.getAllFilesPaths(logsDirPath)).filter((path) =>
      path.endsWith('.jsonl')
    )

    const logsByFile = await Promise.all(
      logFilesPaths.map((logFilePath) =>
        parseLogFile(logFilePath, logsDirPath, filesService, selfLogsWriter)
      )
    )

    return logsByFile.flat()
  }
})
