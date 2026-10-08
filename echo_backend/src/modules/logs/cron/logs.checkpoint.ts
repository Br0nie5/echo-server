import fs from 'node:fs/promises'
import path from 'node:path'

import type { CronConfig } from '../../../shared/config/backConfig.js'

import { LastLogsCheckSchema } from './utils/schemas/lastLogsCheck.schema.js'

/** Remembers when the logs were last checked, so each check only looks at newer logs. */
export interface CheckpointStore {
  /** The stored date, or `undefined` when the file is missing, malformed or holds an invalid date. */
  getLastCheckDate: () => Promise<Date | undefined>
  /** Stores the date, creating the directory of its file if needed. */
  saveLastCheckDate: (date: Date) => Promise<void>
}

/** Keeps the last check date in the JSON file at `lastLogsCheckFilePath`. */
export const createFileCheckpointStore = ({
  lastLogsCheckFilePath
}: CronConfig): CheckpointStore => ({
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
    await fs.mkdir(path.dirname(lastLogsCheckFilePath), { recursive: true })
    await fs.writeFile(
      lastLogsCheckFilePath,
      JSON.stringify({ lastCheck: date.toISOString() }, null, 2),
      'utf-8'
    )
  }
})
