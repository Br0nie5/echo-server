import type { Server, IncomingMessage, ServerResponse } from 'http'

import type { FastifyServerOptions } from 'fastify'
import Fastify from 'fastify'

import { registerAuthRoutes } from './initializers/registerAuthRoutes.js'
import { registerDocumentation } from './initializers/registerDocumentation.js'
import { registerFrontend } from './initializers/registerFrontend.js'
import { registerLogsNotifier } from './initializers/registerLogsNotifier.js'
import { registerLogsRoutes } from './initializers/registerLogsRoutes.js'
import { registerSecurity } from './initializers/registerSecurity.js'
import type { EchoServer } from './initializers/types/echoServer.js'
import { normalizeToEchoError } from './initializers/utils/normalizeToEchoError.js'
import { createLogsFilesApi } from './modules/logs/infra/logsFiles.api.js'
import { createLogsFilesRepository } from './modules/logs/infra/logsFiles.repository.js'
import { createSelfReportRepository } from './modules/selfReport/infra/selfReport.repository.js'
import type { BackConfig } from './shared/config/backConfig.js'
import { loadBackConfig } from './shared/config/loadBackConfig.js'
import { EchoErrorJsonSchema } from './shared/schemas/errors.schemas.js'
import { createFilesService, type FilesService } from './shared/services/files.service.js'

/**
 * Composition root: builds the dependency graph from `config` and wires it into the Fastify app.
 *
 * Whatever reads or writes files is given `filesService`, the one access to the file system.
 */
export const buildServer = async (
  config: BackConfig,
  filesService: FilesService
): Promise<EchoServer> => {
  // Fastify's https/http overloads produce distinct FastifyInstance generics, which would
  // make `server` a union type unusable for the .register() calls below. The raw server type
  // is never introspected past this point, so the options are built once and typed as the
  // plain-http shape Fastify's default overload expects; `https` still drives TLS at runtime.
  const serverOptions = {
    logger: true,
    ...(config.server.tls && { https: config.server.tls })
  } as FastifyServerOptions<Server<typeof IncomingMessage, typeof ServerResponse>>

  const server = Fastify(serverOptions)

  server.setErrorHandler((error, request, reply) => {
    const echoError = normalizeToEchoError(error)
    request.log.error({ err: error }, echoError.message)
    reply.status(echoError.statusCode).send(echoError)
  })

  await registerSecurity(server, config)

  await registerDocumentation(server, config.server)

  server.addSchema(EchoErrorJsonSchema)

  const logsRepository = createLogsFilesRepository(createLogsFilesApi(config.logs, filesService))
  const selfReportRepository = await createSelfReportRepository({
    logsRepository,
    filesService,
    selfReportsConfig: config.selfReports,
    getSelfReportFileName: ({ parseLogFileSelfReportFileName }) => parseLogFileSelfReportFileName,
    logger: server.log
  })

  await registerAuthRoutes(server, config, filesService)
  await registerLogsRoutes(server, config, logsRepository, selfReportRepository)

  await registerFrontend(server, config.server)

  await registerLogsNotifier(server, config, {
    logsRepository,
    selfReportRepository,
    filesService
  })

  return server
}

/**
 * Loads the config, builds the server with it and starts listening, exiting the process on
 * failure.
 *
 * The files service both are given is built here, once. A failure is logged before exiting: by the
 * logger of the server once it is built, to the error output of the process before.
 */
export const startServer = async (): Promise<void> => {
  const filesService = createFilesService()
  let server: EchoServer | undefined

  try {
    const config = await loadBackConfig(filesService)
    server = await buildServer(config, filesService)

    await server.listen({ port: config.server.port, host: config.server.host })

    server.log.info(`Api is accessible through ${config.server.apiUrl}`)
    server.log.info(`App is accessible through ${config.server.appUrl}`)
  } catch (error) {
    if (server) {
      server.log.error(error)
    } else {
      console.error('The server could not be built:', error)
    }
    process.exit(1)
  }
}
