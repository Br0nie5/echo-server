import { onTestFinished } from 'vitest'

import type { Settings } from '../initializers/settings/settings.js'
import type { EchoServer } from '../initializers/types/echoServer.js'
import { buildServer } from '../server.js'
import { createFilesService } from '../shared/services/files.service.js'

import { IN_MEMORY_DATABASE_PATH } from './mocks/inMemoryDatabase.js'
import { createInMemoryFileSystem, type InMemoryFileSystem } from './mocks/inMemoryFileSystem.js'
import { getMockAuthSettings, getMockSettings } from './mocks/mockSettings.js'

/** What `buildTestServer` gives. */
export interface TestServer {
  /** The real server, ready to be sent requests with `server.inject`. */
  server: EchoServer
  /** The settings the server was built with. */
  settings: Settings
  /** The files of the server, to fill before a request and to read after it. */
  fileSystem: InMemoryFileSystem
}

/**
 * Builds the real server, with `buildServer`, for a test: nothing is replaced but the file system,
 * kept in memory, and its logger, which is off.
 *
 * Its settings are those of a server with authentication and nothing optional, neither self
 * reports, logs notifier nor notifications, with `settings` on top: give the part a test is about.
 * The users database is kept in memory too, unless `settings` gives another `auth`. The file system
 * starts with `files`, each path given its content, and with the logs directory of the settings,
 * empty.
 *
 * The server is closed when the test ends.
 *
 * ```ts
 * const { server, fileSystem } = await buildTestServer({
 *   settings: { auth: undefined },
 *   files: { '/logs/billing/logs/send_invoices.jsonl': logLine }
 * })
 *
 * const response = await server.inject({ method: 'GET', url: '/api/logs', query: { fromDate } })
 * ```
 */
export const buildTestServer = async ({
  settings: settingsOverrides,
  files
}: {
  settings?: Partial<Settings>
  files?: Record<string, string>
} = {}): Promise<TestServer> => {
  const settings = getMockSettings({
    auth: getMockAuthSettings({ usersDbFilePath: IN_MEMORY_DATABASE_PATH }),
    logFilesSelfReports: undefined,
    notificationsSelfReports: undefined,
    ...settingsOverrides
  })

  const fileSystem = createInMemoryFileSystem({
    files,
    directories: [settings.logs.logsDirPath]
  })

  const server = await buildServer(settings, createFilesService(fileSystem.fileSystem), false)

  onTestFinished(async () => {
    await server.close()
  })

  return { server, settings, fileSystem }
}
