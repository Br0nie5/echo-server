import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockSelfReportsConfig } from '../../../../test/mocks/mockConfigs.js'
import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import { createFileSessionJobIdApi } from '../fileSessionJobId.api.js'

const selfReportsConfig = getMockSelfReportsConfig({
  sessionFilePath: '/fake/data/nested/self_reports_session.json'
})

const filesService = getMockFilesService()

beforeEach(() => {
  vi.resetAllMocks()
})

describe('SessionJobIdApi', () => {
  describe('getLastSessionJobId', () => {
    it('Should return the session job id the session file holds', async () => {
      filesService.getFileContent.mockResolvedValue('{"lastJobId":7}')

      const lastSessionJobId = await createFileSessionJobIdApi(
        selfReportsConfig,
        filesService
      ).getLastSessionJobId()

      expect(lastSessionJobId).toBe(7)
      expect(filesService.getFileContent).toHaveBeenCalledWith(
        '/fake/data/nested/self_reports_session.json'
      )
    })

    it('Should throw when the file cannot be read', async () => {
      filesService.getFileContent.mockRejectedValue(new Error('ENOENT'))

      await expect(
        createFileSessionJobIdApi(selfReportsConfig, filesService).getLastSessionJobId()
      ).rejects.toThrow('ENOENT')
    })

    it.each([
      ['is not JSON', 'not-json'],
      ['has no lastJobId', '{}'],
      ['has a lastJobId that is not a number', '{"lastJobId":"not-a-number"}'],
      ['has a lastJobId that is not an integer', '{"lastJobId":1.5}']
    ])('Should throw when the content %s', async (_, content) => {
      filesService.getFileContent.mockResolvedValue(content)

      await expect(
        createFileSessionJobIdApi(selfReportsConfig, filesService).getLastSessionJobId()
      ).rejects.toThrow()
    })
  })

  describe('saveLastSessionJobId', () => {
    it('Should create the directory of the file, then replace its content with the session job id', async () => {
      const steps: string[] = []
      filesService.createDirectory.mockImplementation(async () => {
        steps.push('createDirectory')
      })
      filesService.replaceFileContent.mockImplementation(async () => {
        steps.push('replaceFileContent')
      })

      await createFileSessionJobIdApi(selfReportsConfig, filesService).saveLastSessionJobId(8)

      expect(filesService.createDirectory).toHaveBeenCalledWith('/fake/data/nested')
      expect(filesService.replaceFileContent).toHaveBeenCalledWith(
        '/fake/data/nested/self_reports_session.json',
        JSON.stringify({ lastJobId: 8 }, null, 2)
      )
      expect(steps).toEqual(['createDirectory', 'replaceFileContent'])
    })
  })
})
