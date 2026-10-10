import { vi, type Mock } from 'vitest'

import type { FilesService } from '../../shared/services/files.service.js'

/** A `FilesService` whose every method is a mock, to stub and to check the calls of. */
export type MockFilesService = { [Method in keyof FilesService]: Mock<FilesService[Method]> }

/**
 * Builds a `FilesService` for the tests, reaching no file: each method is a `vi.fn()` that
 * resolves to `undefined` until it is stubbed.
 *
 * ```ts
 * const filesService = getMockFilesService()
 * filesService.getFileContent.mockResolvedValue('{"lastJobId":7}')
 * ```
 */
export const getMockFilesService = (): MockFilesService => ({
  createDirectory: vi.fn(),
  getFileContent: vi.fn(),
  getFileLines: vi.fn(),
  getFilesPaths: vi.fn(),
  replaceFileContent: vi.fn(),
  replaceFileLines: vi.fn(),
  restrictFileAccessToOwner: vi.fn()
})
