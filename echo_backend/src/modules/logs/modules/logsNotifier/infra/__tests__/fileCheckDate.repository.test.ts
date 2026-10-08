import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFileCheckDateRepository } from '../fileCheckDate.repository.js'

const checkDateApi = {
  getRawLastCheckDate: vi.fn(),
  saveRawLastCheckDate: vi.fn()
}
const checkDateRepository = createFileCheckDateRepository(checkDateApi)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('FileCheckDateRepository', () => {
  describe('getLastCheckDate', () => {
    it('should return the date the file holds', async () => {
      checkDateApi.getRawLastCheckDate.mockResolvedValueOnce(
        JSON.stringify({ lastCheck: '2026-01-01T00:00:00.000Z' })
      )

      expect(await checkDateRepository.getLastCheckDate()).toEqual({
        lastCheckDate: new Date('2026-01-01T00:00:00.000Z')
      })
    })

    it('should return undefined when the file cannot be read', async () => {
      checkDateApi.getRawLastCheckDate.mockRejectedValueOnce(new Error('ENOENT'))

      expect(await checkDateRepository.getLastCheckDate()).toBeUndefined()
    })

    it('should return undefined when the file holds no valid date', async () => {
      checkDateApi.getRawLastCheckDate.mockResolvedValueOnce('not-json')

      expect(await checkDateRepository.getLastCheckDate()).toBeUndefined()
    })
  })

  describe('saveLastCheckDate', () => {
    it('should save the date as the content of the file', async () => {
      const lastCheckDate = new Date('2026-01-01T00:00:00.000Z')

      await checkDateRepository.saveLastCheckDate({ lastCheckDate })

      expect(checkDateApi.saveRawLastCheckDate).toHaveBeenCalledWith(
        JSON.stringify({ lastCheck: lastCheckDate.toISOString() }, null, 2)
      )
    })
  })
})
