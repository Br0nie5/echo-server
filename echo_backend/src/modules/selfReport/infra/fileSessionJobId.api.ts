import path from 'path'

import type { SelfReportsConfig } from '../../../shared/config/backConfig.js'
import type { FilesService } from '../../../shared/services/files.service.js'

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

/**
 * Builds the access to the session file, found at `sessionFilePath`, read and written through
 * `filesService`.
 *
 * ```ts
 * const sessionJobIdApi = createFileSessionJobIdApi(selfReportsConfig, filesService)
 * const sessionJobId = (await sessionJobIdApi.getLastSessionJobId()) + 1
 * await sessionJobIdApi.saveLastSessionJobId(sessionJobId)
 * ```
 */
export const createFileSessionJobIdApi = (
  { sessionFilePath }: SelfReportsConfig,
  filesService: FilesService
): SessionJobIdApi => ({
  getLastSessionJobId: async (): Promise<number> => {
    const content = await filesService.getFileContent(sessionFilePath)

    return SessionJobIdDtoSchema.parse(JSON.parse(content)).lastJobId
  },

  saveLastSessionJobId: async (lastSessionJobId): Promise<void> => {
    const sessionJobIdDto: SessionJobIdDto = { lastJobId: lastSessionJobId }

    await filesService.createDirectory(path.dirname(sessionFilePath))
    await filesService.replaceFileContent(sessionFilePath, JSON.stringify(sessionJobIdDto, null, 2))
  }
})
