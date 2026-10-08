import nodeFs from 'fs/promises'
import path from 'path'

import type { SelfReportsConfig } from '../../../shared/config/backConfig.js'

import { SessionJobIdDtoSchema, type SessionJobIdDto } from './dto/sessionJobId.dto.js'

/** Access to the session file, the data source the last session job id is stored in. */
export interface SessionJobIdApi {
  /**
   * The session job id the session file holds, an integer.
   *
   * Throws when the file does not exist, cannot be read or holds none: its content is not JSON or
   * does not have the shape of a `SessionJobIdDto`.
   */
  getLastSessionJobId: () => Promise<number>
  /**
   * Makes `lastSessionJobId` the session job id the session file holds, creating the directory of
   * the file when it does not exist yet.
   */
  saveLastSessionJobId: (lastSessionJobId: number) => Promise<void>
}

/** The subset of `fs/promises` used, so it can be replaced in tests. */
export type SessionJobIdFileSystem = Pick<typeof nodeFs, 'mkdir' | 'readFile' | 'writeFile'>

/**
 * Builds the access to the session file, found at `sessionFilePath`, on top of `fileSystem` (the
 * real file system by default).
 *
 * ```ts
 * const sessionJobIdApi = createFileSessionJobIdApi(config.selfReports)
 * const sessionJobId = (await sessionJobIdApi.getLastSessionJobId()) + 1
 * await sessionJobIdApi.saveLastSessionJobId(sessionJobId)
 * ```
 */
export const createFileSessionJobIdApi = (
  { sessionFilePath }: SelfReportsConfig,
  fileSystem: SessionJobIdFileSystem = nodeFs
): SessionJobIdApi => ({
  getLastSessionJobId: async (): Promise<number> => {
    const content = await fileSystem.readFile(sessionFilePath, 'utf-8')

    return SessionJobIdDtoSchema.parse(JSON.parse(content)).lastJobId
  },

  saveLastSessionJobId: async (lastSessionJobId): Promise<void> => {
    const sessionJobIdDto: SessionJobIdDto = { lastJobId: lastSessionJobId }

    await fileSystem.mkdir(path.dirname(sessionFilePath), { recursive: true })
    await fileSystem.writeFile(sessionFilePath, JSON.stringify(sessionJobIdDto, null, 2), 'utf-8')
  }
})
