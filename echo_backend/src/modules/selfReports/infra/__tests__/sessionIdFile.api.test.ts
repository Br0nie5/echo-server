import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import { createSessionIdFileApi } from '../sessionIdFile.api.js'

const sessionFilePath = '/fake/data/nested/self_reports_session.json'

const filesService = getMockFilesService()

beforeEach(() => {
  vi.resetAllMocks()
})

// The session id read and saved is tested through the server (`logs.routes.test.ts`). Here is the
// session file that cannot be read or holds no session id, which the server never writes.
describe('SessionIdApi', () => {
  describe('getLastSessionId', () => {
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
})
