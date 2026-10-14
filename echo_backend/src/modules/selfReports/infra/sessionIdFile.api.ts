import path from 'path'

import type { FilesService } from '../../../shared/services/files.service.js'

import { SessionIdDtoSchema, type SessionIdDto } from './dto/sessionId.dto.js'

/**
 * Access to a session file, the data source the last session id of one self-report file is stored
 * in.
 */
export interface SessionIdApi {
  /**
   * The session id the session file holds, an integer.
   *
   * Throws when the file does not exist, cannot be read or holds none: its content is not JSON or
   * does not have the shape of a `SessionIdDto`.
   */
  getLastSessionId: () => Promise<number>
  /**
   * Makes `lastSessionId` the session id the session file holds, creating the directory of the
   * file when it does not exist yet.
   */
  saveLastSessionId: (lastSessionId: number) => Promise<void>
}

/**
 * Builds the access to the session file found at `sessionFilePath`, read and written through
 * `filesService`.
 *
 * ```ts
 * const sessionIdApi = createSessionIdFileApi(
 *   '/data/self_reports_session.json',
 *   filesService
 * )
 * const sessionId = (await sessionIdApi.getLastSessionId()) + 1
 * await sessionIdApi.saveLastSessionId(sessionId)
 * ```
 */
export const createSessionIdFileApi = (
  sessionFilePath: string,
  filesService: FilesService
): SessionIdApi => ({
  getLastSessionId: async (): Promise<number> => {
    const content = await filesService.getFileContent(sessionFilePath)

    return SessionIdDtoSchema.parse(JSON.parse(content)).lastSessionId
  },

  saveLastSessionId: async (lastSessionId): Promise<void> => {
    const sessionIdDto: SessionIdDto = { lastSessionId }

    await filesService.createDirectory(path.dirname(sessionFilePath))
    await filesService.replaceFileContent(sessionFilePath, JSON.stringify(sessionIdDto, null, 2))
  }
})
