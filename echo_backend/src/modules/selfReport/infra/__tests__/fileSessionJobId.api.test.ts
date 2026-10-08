import { describe, expect, it, vi } from 'vitest'

import { getMockSelfReportsConfig } from '../../../../test/mocks/configs.js'
import { createFileSessionJobIdApi, type SessionJobIdFileSystem } from '../fileSessionJobId.api.js'

const selfReportsConfig = getMockSelfReportsConfig({
  sessionFilePath: '/fake/data/nested/self_reports_session.json'
})

const buildFileSystem = (overrides: Partial<SessionJobIdFileSystem> = {}): SessionJobIdFileSystem =>
  ({
    mkdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    ...overrides
  }) as unknown as SessionJobIdFileSystem

describe('SessionJobIdApi', () => {
  describe('getLastSessionJobId', () => {
    it('should return the session job id the session file holds', async () => {
      const fileSystem = buildFileSystem({
        readFile: vi.fn().mockResolvedValue('{"lastJobId":7}')
      })

      const lastSessionJobId = await createFileSessionJobIdApi(
        selfReportsConfig,
        fileSystem
      ).getLastSessionJobId()

      expect(lastSessionJobId).toBe(7)
      expect(fileSystem.readFile).toHaveBeenCalledWith(
        '/fake/data/nested/self_reports_session.json',
        'utf-8'
      )
    })

    it('should throw when the file cannot be read', async () => {
      const fileSystem = buildFileSystem({
        readFile: vi.fn().mockRejectedValue(new Error('ENOENT'))
      })

      await expect(
        createFileSessionJobIdApi(selfReportsConfig, fileSystem).getLastSessionJobId()
      ).rejects.toThrow('ENOENT')
    })

    it.each([
      ['is not JSON', 'not-json'],
      ['has no lastJobId', '{}'],
      ['has a lastJobId that is not a number', '{"lastJobId":"not-a-number"}'],
      ['has a lastJobId that is not an integer', '{"lastJobId":1.5}']
    ])('should throw when the content %s', async (_, content) => {
      const fileSystem = buildFileSystem({ readFile: vi.fn().mockResolvedValue(content) })

      await expect(
        createFileSessionJobIdApi(selfReportsConfig, fileSystem).getLastSessionJobId()
      ).rejects.toThrow()
    })
  })

  describe('saveLastSessionJobId', () => {
    it('should create the directory of the file and write the session job id in it', async () => {
      const fileSystem = buildFileSystem()

      await createFileSessionJobIdApi(selfReportsConfig, fileSystem).saveLastSessionJobId(8)

      expect(fileSystem.mkdir).toHaveBeenCalledWith('/fake/data/nested', { recursive: true })
      expect(fileSystem.writeFile).toHaveBeenCalledWith(
        '/fake/data/nested/self_reports_session.json',
        JSON.stringify({ lastJobId: 8 }, null, 2),
        'utf-8'
      )
    })
  })
})
