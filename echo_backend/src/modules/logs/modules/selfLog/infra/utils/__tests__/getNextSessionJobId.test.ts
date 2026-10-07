import fs from 'node:fs/promises'
import path from 'node:path'

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises')

import { dataDir } from '../../../../../../../shared/utils/dataDir.js'
import { getNextSessionJobId } from '../getNextSessionJobId.js'

const SELF_LOG_SESSION_FILE_PATH = path.join(dataDir, 'self_logs_session.json')

const expectStoredJobId = (jobId: number): void => {
  expect(fs.mkdir).toHaveBeenCalledWith(dataDir, { recursive: true })
  expect(fs.writeFile).toHaveBeenCalledWith(
    SELF_LOG_SESSION_FILE_PATH,
    JSON.stringify({ lastJobId: jobId }, null, 2),
    'utf-8'
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getNextSessionJobId', () => {
  it('should return the last jobId plus one and store it', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({ lastJobId: 7 }))

    expect(await getNextSessionJobId()).toBe(8)
    expect(fs.readFile).toHaveBeenCalledWith(SELF_LOG_SESSION_FILE_PATH, 'utf-8')
    expectStoredJobId(8)
  })

  it('should return 1 and store it when the session file does not exist', async () => {
    vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('ENOENT'))

    expect(await getNextSessionJobId()).toBe(1)
    expectStoredJobId(1)
  })

  it('should return 1 when the session file contains invalid JSON', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce('not-json')

    expect(await getNextSessionJobId()).toBe(1)
  })

  it('should return 1 when the stored lastJobId is missing or not an integer', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({}))
    expect(await getNextSessionJobId()).toBe(1)

    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({ lastJobId: 'not-a-number' }))
    expect(await getNextSessionJobId()).toBe(1)
  })

  it('should throw when the session file cannot be written', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({ lastJobId: 7 }))
    vi.mocked(fs.writeFile).mockRejectedValueOnce(new Error('EACCES'))

    await expect(getNextSessionJobId()).rejects.toThrow('EACCES')
  })
})
