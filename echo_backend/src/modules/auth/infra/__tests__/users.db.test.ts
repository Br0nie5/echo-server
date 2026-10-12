import Database from 'better-sqlite3'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('better-sqlite3', async (importOriginal) => {
  const { default: ActualDatabase } = await importOriginal<{ default: typeof Database }>()
  return {
    default: vi.fn(function () {
      return new ActualDatabase(':memory:')
    })
  }
})

import { getMockAuthConfig } from '../../../../test/mocks/mockConfigs.js'
import { getMockFilesService } from '../../../../test/mocks/mockFilesService.js'
import { createUsersDb } from '../users.db.js'

const filesService = getMockFilesService()
const usersDbFilePath = '/data/nested/users.db'

describe('createUsersDb', () => {
  let usersDb: Database.Database | undefined

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    usersDb?.close()
    usersDb = undefined
  })

  it('Should create the parent directory, open the file and restrict it to its owner', async () => {
    usersDb = await createUsersDb(getMockAuthConfig({ usersDbFilePath }), filesService)

    expect(filesService.createDirectory).toHaveBeenCalledExactlyOnceWith('/data/nested')
    expect(Database).toHaveBeenCalledExactlyOnceWith(usersDbFilePath)
    expect(filesService.restrictFileAccessToOwner).toHaveBeenCalledExactlyOnceWith(usersDbFilePath)
  })
})
