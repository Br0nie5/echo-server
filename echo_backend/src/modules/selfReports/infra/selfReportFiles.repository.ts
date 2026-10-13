import path from 'path'

import type { FilesService } from '../../../shared/services/files.service.js'
import type { Logger } from '../../../shared/types/logger.js'
import type { SelfReport, SelfReportsSession } from '../domain/selfReport.js'
import type { SelfReportRepository } from '../domain/selfReport.repository.js'

import {
  convertSelfReportLineToSelfReport,
  convertSelfReportToSelfReportLine,
  type SelfReportLineStorage
} from './dto/selfReportLine.dto.js'
import { createSelfReportsFilesApi } from './selfReportsFiles.api.js'
import { createSessionIdFileApi } from './sessionIdFile.api.js'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/** What {@link createSelfReportFilesRepository} needs. */
export interface CreateSelfReportFilesRepositoryOptions {
  /** What the self-report files and the session file of the repository are read and written with. */
  filesService: FilesService
  /** Directory holding the self-report files. */
  selfReportsDirPath: string
  /** Extension, with its dot, a file of `selfReportsDirPath` must have to be read as a self-report file. */
  selfReportFileExtension: string
  /** Name, with its extension, of the file of `selfReportsDirPath` the self reports are stored in. */
  selfReportFileName: string
  /** File the session of the repository is remembered in. */
  sessionFilePath: string
  /** Number of days a stored self report is kept. */
  retentionDays: number
  /** Where what cannot be stored or read is written. */
  logger: Logger
}

/** What tells whether two self reports say the same thing: their level, message and origin. */
const createSelfReportContentKey = ({ level, message, origin }: SelfReport): string =>
  JSON.stringify({ level, message, origin })

/**
 * Creates the `SelfReportRepository` a part of the backend stores its self reports in: a
 * self-report file, one line each, read and written through `filesService`.
 *
 * The file is `selfReportFileName`, in `selfReportsDirPath`. Each part of the backend that reports
 * diagnostics is given its own repository, with its own file, so none of them names a file:
 *
 * ```ts
 * const selfReportRepository = await createSelfReportFilesRepository({
 *   filesService,
 *   selfReportsDirPath: '/self_reports/Echo',
 *   selfReportFileExtension: '.jsonl',
 *   selfReportFileName: 'parseLogs.jsonl',
 *   sessionFilePath: '/data/parse_logs_self_reports_session.json',
 *   retentionDays: 30,
 *   logger: server.log
 * })
 * ```
 *
 * Returns `undefined` when its storage could not be set up.
 *
 * Creating the repository takes its session id: the last one the file at `sessionFilePath` holds,
 * plus one, or `1` when it holds none (it is missing, unreadable or holds none). It then writes
 * its file again without the self reports older than `retentionDays`, which also tells whether
 * the file can be written. The session id is saved last, once the file is ready, so the next
 * repository gets another one, even after a restart of the server. When one of these fails, the
 * error goes to `logger` and `undefined` is returned: an optional feature that is misconfigured
 * never blocks the start of the server.
 *
 * Saving self reports writes the file again, with the stored ones first, as they are, then the new
 * ones, in the order they are given, with the session id of the repository. A new one with the
 * `level`, the `message` and the `origin` of a stored one, or of a new one before it, is left out,
 * and the file is not written when none is left. A failure to save goes to `logger`, and is not
 * thrown.
 *
 * The lines of the file that hold no self report are not read, so they are gone once it is written
 * again.
 *
 * Reading gives the self reports of every self-report file of `selfReportsDirPath`, the files
 * whose name ends with `selfReportFileExtension`, not only those of its own file, each with its
 * session: the session id of its line, and what its file gives it. That is its location, the path
 * of the file, its location name, the name of the file without its extension, and its group name,
 * every directory of the path of the file from the root of the file system, joined with `_`
 * (`self_reports_Echo` for `/self_reports/Echo/parseLogs.jsonl`), or none when the file is in
 * no directory. A failure to read goes to `logger`, and gives none.
 */
export const createSelfReportFilesRepository = async ({
  filesService,
  selfReportsDirPath,
  selfReportFileExtension,
  selfReportFileName,
  sessionFilePath,
  retentionDays,
  logger
}: CreateSelfReportFilesRepositoryOptions): Promise<SelfReportRepository | undefined> => {
  const selfReportsFilesApi = createSelfReportsFilesApi(
    { selfReportsDirPath, selfReportFileExtension },
    filesService
  )
  const sessionIdApi = createSessionIdFileApi(sessionFilePath, filesService)
  const selfReportsFilePath = path.join(selfReportsDirPath, selfReportFileName)

  const getSelfReportLineStorage = (filePath: string): SelfReportLineStorage => {
    const groupName = selfReportsFilesApi
      .getSelfReportFilePathFromRoot(filePath)
      ?.split('/')
      .slice(0, -1)
      .join('_')

    return {
      location: filePath,
      locationName: path.parse(filePath).name,
      groupName: groupName === '' ? undefined : groupName
    }
  }

  const getStoredSelfReports = async (
    filePath: string
  ): Promise<Array<SelfReport & SelfReportsSession>> => {
    const lines = await selfReportsFilesApi.getSelfReportLines(filePath)
    const storage = getSelfReportLineStorage(filePath)

    return lines
      .map((line) => convertSelfReportLineToSelfReport(line, storage))
      .filter((selfReport) => selfReport !== undefined)
  }

  const storeSelfReports = (
    selfReports: Array<SelfReport & Pick<SelfReportsSession, 'sessionId'>>
  ): Promise<void> =>
    selfReportsFilesApi.saveSelfReportLines(
      selfReportsFilePath,
      selfReports.map(convertSelfReportToSelfReportLine)
    )

  let sessionId: number

  try {
    const lastSessionId = await sessionIdApi.getLastSessionId().catch(() => 0)
    sessionId = lastSessionId + 1

    const retentionTime = Date.now() - retentionDays * MILLISECONDS_PER_DAY
    const storedSelfReports = await getStoredSelfReports(selfReportsFilePath)
    await storeSelfReports(storedSelfReports.filter(({ date }) => date.getTime() >= retentionTime))

    await sessionIdApi.saveLastSessionId(sessionId)
  } catch (error) {
    logger.error(
      { err: error, selfReportsFilePath },
      'Failed to set up self reports, disabling them for this session'
    )

    return undefined
  }

  return {
    saveSelfReports: async (selfReports: SelfReport[]): Promise<void> => {
      if (selfReports.length === 0) {
        return
      }

      try {
        const storedSelfReports = await getStoredSelfReports(selfReportsFilePath)
        const storedContentKeys = new Set(storedSelfReports.map(createSelfReportContentKey))
        const newSelfReports: SelfReport[] = []

        for (const selfReport of selfReports) {
          const contentKey = createSelfReportContentKey(selfReport)

          if (!storedContentKeys.has(contentKey)) {
            storedContentKeys.add(contentKey)
            newSelfReports.push(selfReport)
          }
        }

        if (newSelfReports.length > 0) {
          await storeSelfReports([
            ...storedSelfReports,
            ...newSelfReports.map((newSelfReport) => ({ ...newSelfReport, sessionId }))
          ])
        }
      } catch (error) {
        logger.error({ err: error, selfReportsFilePath }, 'Failed to write self reports')
      }
    },

    getAllSelfReports: async (): Promise<Array<SelfReport & SelfReportsSession>> => {
      try {
        const filesPaths = await selfReportsFilesApi.getAllSelfReportFilesPaths()
        const selfReportsByFile = await Promise.all(filesPaths.map(getStoredSelfReports))

        return selfReportsByFile.flat()
      } catch (error) {
        logger.error({ err: error }, 'Failed to read self reports')

        return []
      }
    }
  }
}
