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

import { createAuthController } from './modules/auth/auth.controller.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { createAuthService } from './modules/auth/auth.service.js'
import { openUsersDb } from './modules/auth/users.db.js'
import { createSqliteUsersRepository } from './modules/auth/users.repository.js'
import { createFileCheckpointStore } from './modules/logs/cron/logs.checkpoint.js'
import logsCron from './modules/logs/cron/logs.cron.js'
import { createTelegramNotifier } from './modules/logs/cron/notifications/telegram.notifier.js'
import type { LogsRepository } from './modules/logs/domain/logs.repository.js'
import { createFileLogsApi } from './modules/logs/infra/fileLogs.api.js'
import { createFileLogsRepository } from './modules/logs/infra/fileLogs.repository.js'
import type { SelfLogRepository } from './modules/logs/modules/selfLog/domain/selfLog.repository.js'
import { createNoopSelfLogRepository } from './modules/logs/modules/selfLog/infra/noopSelfLog.repository.js'
import { createSelfFileLogApi } from './modules/logs/modules/selfLog/infra/selfFileLog.api.js'
import { createSelfFileLogRepository } from './modules/logs/modules/selfLog/infra/selfFileLog.repository.js'
import { createLogsController } from './modules/logs/presentation/logs.controller.js'
import { logsRoutes } from './modules/logs/presentation/logs.routes.js'
import type {
  BackConfig,
  CronConfig,
  SelfLogsConfig,
  ServerConfig
} from './shared/config/backConfig.js'
import { loadBackConfig } from './shared/config/loadBackConfig.js'
import { EchoErrorSchema } from './shared/schemas/errors.schemas.js'
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

/** Registers the notifier cron, only when it is configured. */
const registerLogsCron = async (
  server: EchoServer,
  cronConfig: CronConfig | undefined,
  logsRepository: LogsRepository
): Promise<void> => {
  if (cronConfig === undefined) {
    server.log.info('The logs cron is not configured, skipping its registration')
    return
  }

  await server.register(logsCron, {
    cronConfig,
    logsRepository,
    notifier: createTelegramNotifier(cronConfig),
    checkpointStore: createFileCheckpointStore(cronConfig)
  })
}

/** The repository the lines of the log files that hold no log are reported to, storing nothing when the self logs are disabled. */
const getSelfLogRepository = (
  server: EchoServer,
  selfLogsConfig: SelfLogsConfig
): Promise<SelfLogRepository> | SelfLogRepository =>
  selfLogsConfig.isEnabled
    ? createSelfFileLogRepository({
        selfFileLogApi: createSelfFileLogApi(selfLogsConfig),
        selfLogsConfig,
        selfLogFileName: selfLogsConfig.parseLogFileSelfLogFileName,
        logger: server.log
      })
    : createNoopSelfLogRepository()

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

  server.addSchema(EchoErrorSchema)

  const fileLogsRepository = createFileLogsRepository(
    createFileLogsApi(config.logs),
    await getSelfLogRepository(server, config.logs.selfLogs)
  )

  // API
  if (config.auth.hasAuthentication) {
    const usersDb = await openUsersDb(config.auth)
    const userRepository = createSqliteUsersRepository(usersDb)
    const authService = createAuthService(userRepository)
    await server.register(authRoutes, {
      prefix: '/api',
      controller: createAuthController(authService, config.auth)
    })
  }
  await server.register(logsRoutes, {
    prefix: '/api',
    controller: createLogsController(fileLogsRepository),
    hasAuthentication: config.auth.hasAuthentication
  })

  await registerFrontend(server, config.server)
  await registerLogsCron(server, config.logs.cron, fileLogsRepository)

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
