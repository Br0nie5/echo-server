import { describe, expect, it, vi } from 'vitest'

import { getMockLogsNotifierConfig } from '../../../../../../test/mocks/configs.js'
import { createFileCheckDateApi, type CheckDateFileSystem } from '../fileCheckDate.api.js'

const logsNotifierConfig = getMockLogsNotifierConfig({
  lastLogsCheckFilePath: '/fake/data/nested/last_logs_check.json'
})

const buildFileSystem = (overrides: Partial<CheckDateFileSystem> = {}): CheckDateFileSystem =>
  ({
    mkdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    ...overrides
  }) as unknown as CheckDateFileSystem

describe('CheckDateApi', () => {
  describe('getRawLastCheckDate', () => {
    it('should return the content of the last-check file', async () => {
      const fileSystem = buildFileSystem({
        readFile: vi.fn().mockResolvedValue('{"lastCheck":"2026-01-01T00:00:00.000Z"}')
      })

      const rawLastCheckDate = await createFileCheckDateApi(
        logsNotifierConfig,
        fileSystem
      ).getRawLastCheckDate()

      expect(rawLastCheckDate).toBe('{"lastCheck":"2026-01-01T00:00:00.000Z"}')
      expect(fileSystem.readFile).toHaveBeenCalledWith(
        '/fake/data/nested/last_logs_check.json',
        'utf-8'
      )
    })

    it('should throw when the file cannot be read', async () => {
      const fileSystem = buildFileSystem({
        readFile: vi.fn().mockRejectedValue(new Error('ENOENT'))
      })

      await expect(
        createFileCheckDateApi(logsNotifierConfig, fileSystem).getRawLastCheckDate()
      ).rejects.toThrow('ENOENT')
    })
  })

  describe('saveRawLastCheckDate', () => {
    it('should create the directory of the file and write the content in it', async () => {
      const fileSystem = buildFileSystem()

      await createFileCheckDateApi(logsNotifierConfig, fileSystem).saveRawLastCheckDate('content')

      expect(fileSystem.mkdir).toHaveBeenCalledWith('/fake/data/nested', { recursive: true })
      expect(fileSystem.writeFile).toHaveBeenCalledWith(
        '/fake/data/nested/last_logs_check.json',
        'content',
        'utf-8'
      )
    })
  })
})
