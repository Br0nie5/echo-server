import fs from 'node:fs/promises'
import path from 'node:path'

import { z } from 'zod'

import { dataDir } from '../../../../../../shared/utils/dataDir.js'

const selfLogSessionFilePath = path.join(dataDir, 'self_logs_session.json')

/** The jobId stored in the session file, or `undefined` when the file is missing, malformed or holds an invalid value. */
const getLastSessionJobId = async (): Promise<number | undefined> => {
  try {
    const content = await fs.readFile(selfLogSessionFilePath, 'utf-8')

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
 * The last jobId is kept in `self_logs_session.json`, in the data directory, and the one returned
 * replaces it right away, so the next call gets another one, even after a restart of the server.
 * Throws when the file cannot be written; the data directory is created if needed.
 */
export const getNextSessionJobId = async (): Promise<number> => {
  const nextJobId = ((await getLastSessionJobId()) ?? 0) + 1

  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(
    selfLogSessionFilePath,
    JSON.stringify({ lastJobId: nextJobId }, null, 2),
    'utf-8'
  )

  return nextJobId
}
