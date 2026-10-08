import * as crypto from 'crypto'
import type { Server, IncomingMessage, ServerResponse } from 'http'

import fastifyCookie from '@fastify/cookie'
import cors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyStatic from '@fastify/static'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import type { FastifyBaseLogger, FastifyServerOptions, FastifyTypeProviderDefault } from 'fastify'
import Fastify, { type FastifyInstance } from 'fastify'

import { createAuthUsersDbRepository } from './modules/auth/infra/authUsersDb.repository.js'
import { createUsersDb } from './modules/auth/infra/users.db.js'
import { createAuthController } from './modules/auth/presentation/auth.controller.js'
import { authPreHandler } from './modules/auth/presentation/auth.hooks.js'
import { authRoutes } from './modules/auth/presentation/auth.routes.js'
import type { LogsRepository } from './modules/logs/domain/logs.repository.js'
import { createLogsFilesApi, type LogsFilesApi } from './modules/logs/infra/logsFiles.api.js'
import { createLogsFilesRepository } from './modules/logs/infra/logsFiles.repository.js'
import { createFileCheckDateApi } from './modules/logs/modules/logsNotifier/infra/fileCheckDate.api.js'
import { createFileCheckDateRepository } from './modules/logs/modules/logsNotifier/infra/fileCheckDate.repository.js'
import logsNotifier from './modules/logs/modules/logsNotifier/presentation/logs.notifier.js'
import { createLogsController } from './modules/logs/presentation/logs.controller.js'
import { logsRoutes } from './modules/logs/presentation/logs.routes.js'
import { createTelegramNotifierApi } from './modules/notification/infra/telegramNotifier.api.js'
import { createTelegramNotifier } from './modules/notification/infra/telegramNotifier.js'
import type { SelfReportRepository } from './modules/selfReport/domain/selfReport.repository.js'
import { createFileSessionJobIdApi } from './modules/selfReport/infra/fileSessionJobId.api.js'
import { createNoopSelfReportRepository } from './modules/selfReport/infra/noopSelfReport.repository.js'
import { createSelfFileReportRepository } from './modules/selfReport/infra/selfFileReport.repository.js'
import type { BackConfig, SelfReportsConfig, ServerConfig } from './shared/config/backConfig.js'
import { loadBackConfig } from './shared/config/loadBackConfig.js'
import { EchoErrorJsonSchema } from './shared/schemas/errors.schemas.js'
import { isOriginAllowed } from './shared/utils/isOriginAllowed.js'
import { normalizeToEchoError } from './shared/utils/normalizeToEchoError.js'

/** Random secret regenerated at each start, so the sessions do not survive a restart. */
const DYNAMIC_JWT_SECRET = crypto.randomBytes(256).toString('hex')

/** The Fastify instance type used by the server, with the plain-http generics. */
type EchoServer = FastifyInstance<
  Server<typeof IncomingMessage, typeof ServerResponse>,
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  FastifyBaseLogger,
  FastifyTypeProviderDefault
>

/** Registers Swagger (source of `openApi.json`) and its UI, served under `/documentation`. */
const registerDocumentation = async (
  server: EchoServer,
  serverConfig: ServerConfig
): Promise<void> => {
  // Swagger for OpenAPI generation
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'Echo API',
        description: 'Auto-generated API documentation for the Echo server',
        version: '1.0.0'
      },
      servers: [{ url: new URL(serverConfig.apiUrl).origin }],
      tags: [
        {
          name: 'Logs',
          description: 'Everything concerning getting scripts logs'
        },
        {
          name: 'Authentication',
          description: 'Everything concerning authentication if it is enabled'
        }
      ]
    },
    refResolver: {
      buildLocalReference(json, _, __, i) {
        const id = json.$id?.toString()
        return id || `my-fragment-${i}`
      }
    }
  })

  await server.register(swaggerUI, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  })
}

/** Registers cookie/JWT support when authentication is enabled, and CORS restricted to the allowed domain and its subdomains. */
const registerSecurity = async (server: EchoServer, config: BackConfig): Promise<void> => {
  const { allowedDomain } = config.server

  if (config.auth.hasAuthentication) {
    await server.register(fastifyCookie)

    await server.register(fastifyJwt, {
      secret: DYNAMIC_JWT_SECRET,
      cookie: {
        cookieName: config.auth.cookieName,
        signed: false // We verify via JWT signature, so the cookie itself doesn't need a secondary signature
      }
    })
  }

  await server.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        return cb(null, true)
      }

      try {
        if (isOriginAllowed(origin, allowedDomain)) {
          return cb(null, true)
        }

        return cb(new Error(`Not allowed by CORS: ${origin} (Allowed: ${allowedDomain})`), false)
      } catch {
        return cb(new Error('Invalid Origin Header'), false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  })
}

/** Serves the built frontend under `/app`. Unknown `/app/*` paths get `index.html` (SPA routing), anything else a JSON 404. */
const registerFrontend = async (
  server: EchoServer,
  { frontendDistDirPath }: ServerConfig
): Promise<void> => {
  await server.register(fastifyStatic, {
    root: frontendDistDirPath,
    prefix: '/app'
  })

  server.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/app')) {
      return reply.sendFile('index.html', frontendDistDirPath)
    }
    return reply.code(404).send({ error: 'Not found' })
  })
}

/** The repository storing its self reports in the file named `selfReportFileName`, through `logsFilesApi`, or storing nothing when the self reports are disabled. */
const getSelfReportRepository = (
  server: EchoServer,
  logsFilesApi: LogsFilesApi,
  selfReportsConfig: SelfReportsConfig,
  selfReportFileName: string
): Promise<SelfReportRepository> | SelfReportRepository =>
  selfReportsConfig.isEnabled
    ? createSelfFileReportRepository({
        logsFilesApi,
        sessionJobIdApi: createFileSessionJobIdApi(selfReportsConfig),
        selfReportsConfig,
        selfReportFileName,
        logger: server.log
      })
    : createNoopSelfReportRepository()

/** Registers the cron notifying the problem logs, only when it is configured along with the notifications. */
const registerLogsNotifier = async (
  server: EchoServer,
  {
    logs: { logsNotifier: logsNotifierConfig },
    selfReports: selfReportsConfig,
    notification: notificationConfig
  }: BackConfig,
  logsFilesApi: LogsFilesApi,
  logsRepository: LogsRepository
): Promise<void> => {
  if (logsNotifierConfig === undefined || notificationConfig === undefined) {
    server.log.info('The logs notifier is not configured, skipping its registration')
    return
  }

  await server.register(logsNotifier, {
    logsNotifierConfig,
    logsRepository,
    notifier: createTelegramNotifier(
      createTelegramNotifierApi(notificationConfig),
      notificationConfig
    ),
    checkDateRepository: createFileCheckDateRepository(createFileCheckDateApi(logsNotifierConfig)),
    selfReportRepository: await getSelfReportRepository(
      server,
      logsFilesApi,
      selfReportsConfig,
      selfReportsConfig.logsNotifierSelfReportFileName
    )
  })
}

/**
 * Composition root: builds the dependency graph from `config` (the one `loadBackConfig` gives by
 * default) and wires it into the Fastify app.
 */
export const buildServer = async (config: BackConfig = loadBackConfig()): Promise<EchoServer> => {
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

  const logsFilesApi = createLogsFilesApi(config.logs)
  const logsFilesRepository = createLogsFilesRepository(
    logsFilesApi,
    await getSelfReportRepository(
      server,
      logsFilesApi,
      config.selfReports,
      config.selfReports.parseLogFileSelfReportFileName
    )
  )

  // API
  if (config.auth.hasAuthentication) {
    const authRepository = createAuthUsersDbRepository(await createUsersDb(config.auth))
    await server.register(authRoutes, {
      prefix: '/api',
      controller: createAuthController(authRepository, config.auth)
    })
  }
  await server.register(logsRoutes, {
    prefix: '/api',
    controller: createLogsController(logsFilesRepository),
    preHandler: config.auth.hasAuthentication ? authPreHandler : undefined
  })

  await registerFrontend(server, config.server)
  await registerLogsNotifier(server, config, logsFilesApi, logsFilesRepository)

  return server
}

/** Entry point: loads the config, builds the server with it and starts listening, exiting the process on failure. */
const startServer = async (): Promise<void> => {
  const config = loadBackConfig()
  const server = await buildServer(config)

  try {
    await server.listen({ port: config.server.port, host: config.server.host })

    console.log(`Api is accessible though ${config.server.apiUrl}`)
    console.log(`App is accessible though ${config.server.appUrl}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

void startServer()
