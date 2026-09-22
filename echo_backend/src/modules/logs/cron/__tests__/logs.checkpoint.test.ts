import fs from 'node:fs/promises'

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises')

import { createFileCheckpointStore } from '../logs.checkpoint.js'

const store = createFileCheckpointStore('/fake/data', '/fake/data/last_logs_check.json')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CheckpointStore', () => {
  describe('getLastCheckDate', () => {
    it('should return the parsed date when the file contains a valid date', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce(
        JSON.stringify({ lastCheck: '2026-01-01T00:00:00.000Z' })
      )

      const result = await store.getLastCheckDate()

      expect(result).toEqual(new Date('2026-01-01T00:00:00.000Z'))
    })

    it('should return undefined when the file does not exist', async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('ENOENT'))

      const result = await store.getLastCheckDate()

      expect(result).toBeUndefined()
    })

    it('should return undefined when the file contains invalid JSON', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce('not-json')

      const result = await store.getLastCheckDate()

      expect(result).toBeUndefined()
    })

    it('should return undefined when the stored date string is invalid', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({ lastCheck: 'not-a-date' }))

      const result = await store.getLastCheckDate()

      expect(result).toBeUndefined()
    })

    it('should return undefined when the stored lastCheck field is not a string', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({ lastCheck: 123 }))

      const result = await store.getLastCheckDate()

      expect(result).toBeUndefined()
    })

    it('should return undefined when the stored payload is missing the lastCheck field', async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({}))

      const result = await store.getLastCheckDate()

      expect(result).toBeUndefined()
    })
  })

  describe('saveLastCheckDate', () => {
    it('should create the data directory and write the date as JSON', async () => {
      const date = new Date('2026-01-01T00:00:00.000Z')

      await store.saveLastCheckDate(date)

      expect(fs.mkdir).toHaveBeenCalledWith('/fake/data', { recursive: true })
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/fake/data/last_logs_check.json',
        JSON.stringify({ lastCheck: date.toISOString() }, null, 2),
        'utf-8'
      )
    })
  })
})
