import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockLogsNotifierConfig } from '../../../../../../test/mocks/configs.js'
import { getMockFilesService } from '../../../../../../test/mocks/filesService.js'
import { createFileCheckDateApi } from '../fileCheckDate.api.js'

const logsNotifierConfig = getMockLogsNotifierConfig({
  lastLogsCheckFilePath: '/fake/data/nested/last_logs_check.json'
})

const filesService = getMockFilesService()

beforeEach(() => {
  vi.resetAllMocks()
})

describe('CheckDateApi', () => {
  describe('getRawLastCheckDate', () => {
    it('should return the content of the last-check file', async () => {
      filesService.getFileContent.mockResolvedValue('{"lastCheck":"2026-01-01T00:00:00.000Z"}')

      const rawLastCheckDate = await createFileCheckDateApi(
        logsNotifierConfig,
        filesService
      ).getRawLastCheckDate()

      expect(rawLastCheckDate).toBe('{"lastCheck":"2026-01-01T00:00:00.000Z"}')
      expect(filesService.getFileContent).toHaveBeenCalledWith(
        '/fake/data/nested/last_logs_check.json'
      )
    })

    it('should throw when the file cannot be read', async () => {
      filesService.getFileContent.mockRejectedValue(new Error('ENOENT'))

      await expect(
        createFileCheckDateApi(logsNotifierConfig, filesService).getRawLastCheckDate()
      ).rejects.toThrow('ENOENT')
    })
  })

  describe('saveRawLastCheckDate', () => {
    it('should create the directory of the file, then replace its content', async () => {
      const steps: string[] = []
      filesService.createDirectory.mockImplementation(async () => {
        steps.push('createDirectory')
      })
      filesService.replaceFileContent.mockImplementation(async () => {
        steps.push('replaceFileContent')
      })

      await createFileCheckDateApi(logsNotifierConfig, filesService).saveRawLastCheckDate('content')

      expect(filesService.createDirectory).toHaveBeenCalledWith('/fake/data/nested')
      expect(filesService.replaceFileContent).toHaveBeenCalledWith(
        '/fake/data/nested/last_logs_check.json',
        'content'
      )
      expect(steps).toEqual(['createDirectory', 'replaceFileContent'])
    })
  })
})
