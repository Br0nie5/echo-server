import fs from 'node:fs/promises'

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises')

import { createFileSelfLogsSessionStore, getNextSessionJobId } from '../selfLogs.session.js'

const store = createFileSelfLogsSessionStore('/fake/data', '/fake/data/self_logs_session.json')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SelfLogsSessionStore', () => {
  describe('getLastJobId', () => {
    it('should return the stored jobId when the file contains a valid value', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({ lastJobId: 5 }))

      const result = await store.getLastJobId()

      expect(result).toBe(5)
    })

    it('should return undefined when the file does not exist', async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('ENOENT'))

      const result = await store.getLastJobId()

      expect(result).toBeUndefined()
    })

    it('should return undefined when the file contains invalid JSON', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce('not-json')

      const result = await store.getLastJobId()

      expect(result).toBeUndefined()
    })

    it('should return undefined when the stored lastJobId field is not a valid integer', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({ lastJobId: 'not-a-number' }))

      const result = await store.getLastJobId()

      expect(result).toBeUndefined()
    })

    it('should return undefined when the stored payload is missing the lastJobId field', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({}))

      const result = await store.getLastJobId()

      expect(result).toBeUndefined()
    })
  })

  describe('saveLastJobId', () => {
    it('should create the data directory and write the jobId as JSON', async () => {
      await store.saveLastJobId(5)

      expect(fs.mkdir).toHaveBeenCalledWith('/fake/data', { recursive: true })
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/fake/data/self_logs_session.json',
        JSON.stringify({ lastJobId: 5 }, null, 2),
        'utf-8'
      )
    })
  })
})

describe('getNextSessionJobId', () => {
  it('should return 1 and persist it when no jobId was stored yet', async () => {
    vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('ENOENT'))

    const jobId = await getNextSessionJobId(store)

    expect(jobId).toBe(1)
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/fake/data/self_logs_session.json',
      JSON.stringify({ lastJobId: 1 }, null, 2),
      'utf-8'
    )
  })

  it('should return the last jobId plus one and persist it', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({ lastJobId: 7 }))

    const jobId = await getNextSessionJobId(store)

    expect(jobId).toBe(8)
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/fake/data/self_logs_session.json',
      JSON.stringify({ lastJobId: 8 }, null, 2),
      'utf-8'
    )
  })
})
