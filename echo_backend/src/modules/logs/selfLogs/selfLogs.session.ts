import fs from 'node:fs/promises'
import path from 'node:path'

import { dataDir } from '../../../shared/utils/dataDir.js'

import { SelfLogsSessionSchema } from './utils/schemas/selfLogsSession.schema.js'

/** File where the last self-logs `jobId` is stored, so each server boot gets a distinct one. */
export const selfLogsSessionFile = path.join(dataDir, 'self_logs_session.json')

/** Remembers the last `jobId` used by the self-logs writer, one per server boot. */
export interface SelfLogsSessionStore {
  /** The stored jobId, or `undefined` when the file is missing, malformed or holds an invalid value. */
  getLastJobId: () => Promise<number | undefined>
  /** Stores the jobId, creating the data directory if needed. */
  saveLastJobId: (jobId: number) => Promise<void>
}

/** Keeps the last self-logs jobId in a JSON file, inside `dataDirPath`. */
export const createFileSelfLogsSessionStore = (
  dataDirPath: string,
  selfLogsSessionFilePath: string
): SelfLogsSessionStore => ({
  getLastJobId: async (): Promise<number | undefined> => {
    try {
      const content = await fs.readFile(selfLogsSessionFilePath, 'utf-8')
      const { lastJobId } = SelfLogsSessionSchema.parse(JSON.parse(content))

      return lastJobId
    } catch {
      return undefined
    }
  },

  saveLastJobId: async (jobId: number): Promise<void> => {
    await fs.mkdir(dataDirPath, { recursive: true })
    await fs.writeFile(
      selfLogsSessionFilePath,
      JSON.stringify({ lastJobId: jobId }, null, 2),
      'utf-8'
    )
  }
})

/** The jobId for this server boot: the last stored one plus one, or `1` if none. Persists it immediately. */
export const getNextSessionJobId = async (store: SelfLogsSessionStore): Promise<number> => {
  const lastJobId = await store.getLastJobId()
  const nextJobId = (lastJobId ?? 0) + 1

  await store.saveLastJobId(nextJobId)

  return nextJobId
}
