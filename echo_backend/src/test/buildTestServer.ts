import { onTestFinished } from 'vitest'

import type { EchoServer } from '../initializers/types/echoServer.js'
import { buildServer } from '../server.js'
import type { BackConfig } from '../shared/config/backConfig.js'
import { createFilesService } from '../shared/services/files.service.js'

import { createInMemoryFileSystem, type InMemoryFileSystem } from './mocks/inMemoryFileSystem.js'
import { getMockAuthConfig, getMockBackConfig } from './mocks/mockConfigs.js'

/** Where SQLite keeps a database in memory, in place of the path of a file. */
const IN_MEMORY_DATABASE_PATH = ':memory:'

/** What `buildTestServer` gives. */
export interface TestServer {
  /** The real server, ready to be sent requests with `server.inject`. */
  server: EchoServer
  /** The config the server was built with. */
  config: BackConfig
  /** The files of the server, to fill before a request and to read after it. */
  fileSystem: InMemoryFileSystem
}

/**
 * Builds the real server, with `buildServer`, for a test: nothing is replaced but the file system,
 * kept in memory, and its logger, which is off.
 *
 * Its config is the one of a server with authentication and nothing optional, neither self reports,
 * logs notifier nor notifications, with `config` on top: give the part a test is about. The users
 * database is kept in memory too, unless `config` gives another `auth`. The file system starts with
 * `files`, each path given its content, and with the logs directory of the config, empty.
 *
 * The server is closed when the test ends.
 *
 * ```ts
 * const { server, fileSystem } = await buildTestServer({
 *   config: { auth: undefined },
 *   files: { '/logs/billing/logs/send_invoices.jsonl': logLine }
 * })
 *
 * const response = await server.inject({ method: 'GET', url: '/api/logs', query: { fromDate } })
 * ```
 */
export const buildTestServer = async ({
  config: configOverrides,
  files
}: {
  config?: Partial<BackConfig>
  files?: Record<string, string>
} = {}): Promise<TestServer> => {
  const config = getMockBackConfig({
    auth: getMockAuthConfig({ usersDbFilePath: IN_MEMORY_DATABASE_PATH }),
    selfReports: undefined,
    ...configOverrides
  })

  const fileSystem = createInMemoryFileSystem({
    files: {
      // SQLite creates no file for a database it keeps in memory, and the server restricts the
      // access to the file of its database once it is open.
      ...(config.auth?.usersDbFilePath === IN_MEMORY_DATABASE_PATH && {
        [IN_MEMORY_DATABASE_PATH]: ''
      }),
      ...files
    },
    directories: [config.logs.logsDirPath]
  })

  const server = await buildServer(config, createFilesService(fileSystem.fileSystem), false)

  onTestFinished(async () => {
    await server.close()
  })

  return { server, config, fileSystem }
}
