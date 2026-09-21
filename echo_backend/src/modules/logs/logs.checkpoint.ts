import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { LastLogsCheckSchema } from './utils/schemas/lastLogsCheck.schema.js'

/** ESM has no `__dirname`, so it is rebuilt from the module URL. */
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Directory holding the persistent data (users database, last check date), at the repository root. */
export const dataDir = path.join(__dirname, '../../../../data')
/** File where the date of the last logs check is stored. */
export const lastLogsCheckFile = path.join(dataDir, 'last_logs_check.json')

/** Remembers when the logs were last checked, so each check only looks at newer logs. */
export interface CheckpointStore {
  /** The stored date, or `undefined` when the file is missing, malformed or holds an invalid date. */
  getLastCheckDate: () => Promise<Date | undefined>
  /** Stores the date, creating the data directory if needed. */
  saveLastCheckDate: (date: Date) => Promise<void>
}

/** Keeps the last check date in a JSON file, inside `dataDirPath`. */
export const createFileCheckpointStore = (
  dataDirPath: string,
  lastLogsCheckFilePath: string
): CheckpointStore => ({
  getLastCheckDate: async (): Promise<Date | undefined> => {
    try {
      const content = await fs.readFile(lastLogsCheckFilePath, 'utf-8')
      const { lastCheck } = LastLogsCheckSchema.parse(JSON.parse(content))
      const parsed = new Date(lastCheck)

      if (isNaN(parsed.getTime())) {
        throw new Error('Invalid date stored in last-check file')
      }

      return parsed
    } catch {
      return undefined
    }
  },

  saveLastCheckDate: async (date: Date): Promise<void> => {
    await fs.mkdir(dataDirPath, { recursive: true })
    await fs.writeFile(
      lastLogsCheckFilePath,
      JSON.stringify({ lastCheck: date.toISOString() }, null, 2),
      'utf-8'
    )
  }
})
