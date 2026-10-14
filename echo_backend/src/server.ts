import type { Server, IncomingMessage, ServerResponse } from 'http'

import type { FastifyServerOptions } from 'fastify'
import Fastify from 'fastify'

import { registerAuthRoutes } from './initializers/registerAuthRoutes.js'
import { registerDocumentation } from './initializers/registerDocumentation.js'
import { registerFrontend } from './initializers/registerFrontend.js'
import { registerLogsNotifier } from './initializers/registerLogsNotifier.js'
import { registerLogsRoutes } from './initializers/registerLogsRoutes.js'
import { registerSecurity } from './initializers/registerSecurity.js'
import { loadSettings } from './initializers/settings/loadSettings.js'
import type { SelfReportsSettings, Settings } from './initializers/settings/settings.js'
import type { EchoServer } from './initializers/types/echoServer.js'
import { addBasePath } from './initializers/utils/addBasePath.js'
import { normalizeToEchoError } from './initializers/utils/normalizeToEchoError.js'
import { removeBasePath } from './initializers/utils/removeBasePath.js'
import { createLogsRepository } from './modules/logs/infra/logs.repository.js'
import type { SelfReportRepository } from './modules/selfReports/domain/selfReport.repository.js'
import { createSelfReportFilesRepository } from './modules/selfReports/infra/selfReportFiles.repository.js'
import { EchoErrorJsonSchema } from './shared/schemas/errors.schemas.js'
import { createFilesService, type FilesService } from './shared/services/files.service.js'

/**
 * Composition root: builds the dependency graph from `settings` and wires it into the Fastify app.
 *
 * The settings stop here: a module is given its config as it is, and what implements its storage
 * the values it needs, one by one. Whatever reads or writes files is given `filesService`, the one
 * access to the file system. Each part of the backend that reports is given a self-report
 * repository of its own, built here when its settings are there, and the logs are given every one
 * of them to show. A request is routed the same whether the reverse proxy forwarded it with the
 * `basePath` of the settings or without it, and a redirection to a path of the server is sent
 * below `basePath`, where the browser reaches it. The protocol, the host and the address of a
 * request are those its `X-Forwarded-*` headers give when it comes from one of the
 * `trustedProxies` of the settings, or from anything when the settings have none.
 *
 * The server logs to the output of the process, unless `hasLogger` is `false`.
 */
export const buildServer = async (
  settings: Settings,
  filesService: FilesService,
  hasLogger: boolean = true
): Promise<EchoServer> => {
  // Fastify's https/http overloads produce distinct FastifyInstance generics, which would
  // make `server` a union type unusable for the .register() calls below. The raw server type
  // is never introspected past this point, so the options are built once and typed as the
  // plain-http shape Fastify's default overload expects; `https` still drives TLS at runtime.
  const serverOptions = {
    logger: hasLogger,
    trustProxy: settings.server.trustedProxies ?? true,
    // Node.js only leaves the `url` of a message undefined for a response a client received: a
    // request a server received always has one.
    rewriteUrl: (request: IncomingMessage) =>
      removeBasePath(request.url as string, settings.server.basePath),
    ...(settings.server.tls && { https: settings.server.tls })
  } as FastifyServerOptions<Server<typeof IncomingMessage, typeof ServerResponse>>

  const server = Fastify(serverOptions)

  server.addHook('onSend', async (_request, reply, payload) => {
    const location = reply.getHeader('location')

    if (typeof location === 'string') {
      reply.header('location', addBasePath(location, settings.server.basePath))
    }

    return payload
  })

  server.setErrorHandler((error, request, reply) => {
    const echoError = normalizeToEchoError(error)

    if (echoError.statusCode >= 500) {
      request.log.error({ err: error }, echoError.message)
    } else {
      request.log.info({ err: error }, echoError.message)
    }

    reply.status(echoError.statusCode).send(echoError)
  })

  await registerSecurity(server, settings)

  await registerDocumentation(server, settings.server)

  server.addSchema(EchoErrorJsonSchema)

  const createSelfReportRepository = async (
    selfReportsSettings: SelfReportsSettings | undefined
  ): Promise<SelfReportRepository | undefined> =>
    selfReportsSettings &&
    createSelfReportFilesRepository({
      filesService,
      selfReportsDirPath: selfReportsSettings.dirPath,
      groupRootDirPath: selfReportsSettings.rootDirPath,
      selfReportFileName: selfReportsSettings.fileName,
      sessionFilePath: selfReportsSettings.sessionFilePath,
      retentionDays: selfReportsSettings.retentionDays,
      isEachProblemStoredOnce: selfReportsSettings.isEachProblemStoredOnce,
      logger: server.log
    })

  const parseLogsSelfReportRepository = await createSelfReportRepository(
    settings.parseLogsSelfReports
  )
  const notificationsSelfReportRepository = await createSelfReportRepository(
    settings.notificationsSelfReports
  )

  const logsRepository = createLogsRepository({
    logsDirPath: settings.logs.logsDirPath,
    logFileExtension: settings.logs.logFileExtension,
    logFilesDirName: settings.logs.logFilesDirName,
    filesService,
    parseLogsSelfReportRepository,
    selfReportRepositoriesToShow: [
      parseLogsSelfReportRepository,
      notificationsSelfReportRepository
    ].filter((selfReportRepository) => selfReportRepository !== undefined)
  })

  await registerAuthRoutes(server, settings, filesService)
  await registerLogsRoutes(server, settings, logsRepository)

  await registerFrontend(server, settings.server, filesService)

  await registerLogsNotifier(server, settings, {
    logsRepository,
    notificationsSelfReportRepository,
    filesService
  })

  return server
}

/**
 * Loads the settings, builds the server with them and starts listening, exiting the process on
 * failure.
 *
 * The files service both are given is built here, once. A failure is logged before exiting: by the
 * logger of the server once it is built, before that to the error output of the process, saying
 * whether the settings could not be loaded or the server could not be built.
 *
 * Once listening, the server is closed when the process is asked to stop (`SIGTERM`, `SIGINT`): it
 * answers the requests it received and lets a check of the logs notifier end, then the process
 * exits.
 */
export const startServer = async (): Promise<void> => {
  const filesService = createFilesService()
  let settings: Settings | undefined
  let server: EchoServer | undefined

  try {
    settings = await loadSettings(filesService)
    server = await buildServer(settings, filesService)

    await server.listen({ port: settings.server.port, host: settings.server.host })

    const { basePath, apiRoutePrefix, appRoutePrefix } = settings.server
    server.log.info(`Api is served under ${basePath}${apiRoutePrefix}`)
    server.log.info(`App is served under ${basePath}${appRoutePrefix}`)

    const listeningServer = server
    const closeServer = async (signal: NodeJS.Signals): Promise<void> => {
      listeningServer.log.info(`${signal} received, closing the server`)
      await listeningServer.close()
      process.exit(0)
    }

    process.once('SIGTERM', closeServer)
    process.once('SIGINT', closeServer)
  } catch (error) {
    if (!settings) {
      console.error('The settings could not be loaded:', error)
    } else if (!server) {
      console.error('The server could not be built:', error)
    } else {
      server.log.error(error)
    }
    process.exit(1)
  }
}
