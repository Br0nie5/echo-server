import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import { createSessionIdFileApi } from '../sessionIdFile.api.js'

const sessionFilePath = '/fake/data/nested/self_reports_session.json'

const filesService = getMockFilesService()

beforeEach(() => {
  vi.resetAllMocks()
})

describe('SessionIdApi', () => {
  describe('getLastSessionId', () => {
    it('Should return the session id the session file holds', async () => {
      filesService.getFileContent.mockResolvedValue('{"lastSessionId":7}')

      const lastSessionId = await createSessionIdFileApi(
        sessionFilePath,
        filesService
      ).getLastSessionId()

      expect(lastSessionId).toBe(7)
      expect(filesService.getFileContent).toHaveBeenCalledWith(
        '/fake/data/nested/self_reports_session.json'
      )
    })

    it('Should throw when the file cannot be read', async () => {
      filesService.getFileContent.mockRejectedValue(new Error('ENOENT'))

      await expect(
        createSessionIdFileApi(sessionFilePath, filesService).getLastSessionId()
      ).rejects.toThrow('ENOENT')
    })

    it.each([
      ['is not JSON', 'not-json'],
      ['has no lastSessionId', '{}'],
      ['has a lastSessionId that is not a number', '{"lastSessionId":"not-a-number"}'],
      ['has a lastSessionId that is not an integer', '{"lastSessionId":1.5}']
    ])('Should throw when the content %s', async (_, content) => {
      filesService.getFileContent.mockResolvedValue(content)

      await expect(
        createSessionIdFileApi(sessionFilePath, filesService).getLastSessionId()
      ).rejects.toThrow()
    })
  })

  describe('saveLastSessionId', () => {
    it('Should create the directory of the file, then replace its content with the session id', async () => {
      const steps: string[] = []
      filesService.createDirectory.mockImplementation(async () => {
        steps.push('createDirectory')
      })
      filesService.replaceFileContent.mockImplementation(async () => {
        steps.push('replaceFileContent')
      })

      await createSessionIdFileApi(sessionFilePath, filesService).saveLastSessionId(8)

      expect(filesService.createDirectory).toHaveBeenCalledWith('/fake/data/nested')
      expect(filesService.replaceFileContent).toHaveBeenCalledWith(
        '/fake/data/nested/self_reports_session.json',
        JSON.stringify({ lastSessionId: 8 }, null, 2)
      )
      expect(steps).toEqual(['createDirectory', 'replaceFileContent'])
    })
  })
})
