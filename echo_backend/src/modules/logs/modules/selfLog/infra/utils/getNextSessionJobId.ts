import fs from 'node:fs/promises'
import path from 'node:path'

import { z } from 'zod'

import type { SelfLogsConfig } from '../../../../../../shared/config/backConfig.js'

/** The jobId stored in the session file, or `undefined` when the file is missing, malformed or holds an invalid value. */
const getLastSessionJobId = async (sessionFilePath: string): Promise<number | undefined> => {
  try {
    const content = await fs.readFile(sessionFilePath, 'utf-8')

    return z
      .object({
        lastJobId: z.number().int()
      })
      .parse(JSON.parse(content)).lastJobId
  } catch {
    return undefined
  }
}

/**
 * Returns the next jobId the self logs are written with: the last one plus one, or `1` when there
 * is none.
 *
 * The last jobId is kept in the file at `sessionFilePath`, and the one returned replaces it right
 * away, so the next call gets another one, even after a restart of the server. The directory of
 * the file is created if needed. Throws when the file cannot be written.
 */
export const getNextSessionJobId = async ({ sessionFilePath }: SelfLogsConfig): Promise<number> => {
  const nextJobId = ((await getLastSessionJobId(sessionFilePath)) ?? 0) + 1

  await fs.mkdir(path.dirname(sessionFilePath), { recursive: true })
  await fs.writeFile(sessionFilePath, JSON.stringify({ lastJobId: nextJobId }, null, 2), 'utf-8')

  return nextJobId
}
