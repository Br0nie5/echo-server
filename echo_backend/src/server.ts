import type { Server, IncomingMessage, ServerResponse } from 'http'

import type { FastifyServerOptions } from 'fastify'
import Fastify from 'fastify'

import { createLogsFilesApi } from './modules/logs/infra/logsFiles.api.js'
import { createLogsFilesRepository } from './modules/logs/infra/logsFiles.repository.js'
import { registerAuthRoutes } from './plugins/registerAuthRoutes.js'
import { registerDocumentation } from './plugins/registerDocumentation.js'
import { registerFrontend } from './plugins/registerFrontend.js'
import { registerLogsNotifier } from './plugins/registerLogsNotifier.js'
import { registerLogsRoutes } from './plugins/registerLogsRoutes.js'
import { registerSecurity } from './plugins/registerSecurity.js'
import type { EchoServer } from './plugins/types/echoServer.js'
import { getSelfReportRepository } from './plugins/utils/getSelfReportRepository.js'
import { normalizeToEchoError } from './plugins/utils/normalizeToEchoError.js'
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
  const selfReportRepository = await getSelfReportRepository(
    server,
    logsRepository,
    filesService,
    config.selfReports,
    ({ parseLogFileSelfReportFileName }) => parseLogFileSelfReportFileName
  )

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
 * The files service both are given is built here, once.
 */
export const startServer = async (): Promise<void> => {
  const filesService = createFilesService()
  const config = await loadBackConfig(filesService)
  const server = await buildServer(config, filesService)

  try {
    await server.listen({ port: config.server.port, host: config.server.host })

    console.log(`Api is accessible though ${config.server.apiUrl}`)
    console.log(`App is accessible though ${config.server.appUrl}`)
  } catch (error) {
    server.log.error(error)
    process.exit(1)
  }
}
