import * as crypto from 'crypto'
import type { Server, IncomingMessage, ServerResponse } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

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
import {
  createFileCheckpointStore,
  lastLogsCheckFile
} from './modules/logs/cron/logs.checkpoint.js'
import logsCron from './modules/logs/cron/logs.cron.js'
import { createTelegramNotifier } from './modules/logs/cron/notifications/telegram.notifier.js'
import { createLogsController } from './modules/logs/logs.controller.js'
import { createFileLogsRepository } from './modules/logs/logs.repository.js'
import { logsRoutes } from './modules/logs/logs.routes.js'
import { createLogsService, type LogsService } from './modules/logs/logs.service.js'
import {
  createFileSelfLogsSessionStore,
  getNextSessionJobId,
  selfLogsSessionFile
} from './modules/logs/selfLogs/selfLogs.session.js'
import {
  createNoopSelfLogsWriter,
  createSelfLogsWriter
} from './modules/logs/selfLogs/selfLogs.writer.js'
import { EchoErrorSchema } from './shared/schemas/errors.schemas.js'
import { createFilesService } from './shared/services/files.service.js'
import type { EchoBackEnv } from './shared/types/echoBackEnv.js'
import { dataDir } from './shared/utils/dataDir.js'
import { isOriginAllowed } from './shared/utils/isOriginAllowed.js'
import { normalizeToEchoError } from './shared/utils/normalizeToEchoError.js'
import { env as defaultEnv } from './shared/utils/parseEchoBackEnv.js'

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
const registerDocumentation = async (server: EchoServer, env: EchoBackEnv): Promise<void> => {
  // Swagger for OpenAPI generation
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'Echo API',
        description: 'Auto-generated API documentation for the Echo server',
        version: '1.0.0'
      },
      servers: [{ url: new URL(env.API_URL).origin }],
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
const registerSecurity = async (server: EchoServer, env: EchoBackEnv): Promise<void> => {
  if (env.HAS_AUTHENTICATION) {
    await server.register(fastifyCookie)

    await server.register(fastifyJwt, {
      secret: DYNAMIC_JWT_SECRET,
      cookie: {
        cookieName: env.COOKIE_NAME,
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
        if (isOriginAllowed(origin, env.ALLOWED_DOMAIN)) {
          return cb(null, true)
        }

        return cb(
          new Error(`Not allowed by CORS: ${origin} (Allowed: ${env.ALLOWED_DOMAIN})`),
          false
        )
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
const registerFrontend = async (server: EchoServer, echoFrontDist: string): Promise<void> => {
  await server.register(fastifyStatic, {
    root: echoFrontDist,
    prefix: '/app'
  })

  server.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/app')) {
      return reply.sendFile('index.html', echoFrontDist)
    }
    return reply.code(404).send({ error: 'Not found' })
  })
}

/** Registers the notifier cron, only when `LOGS_CRON_OPTIONS` is set. */
const registerLogsCron = async (
  server: EchoServer,
  env: EchoBackEnv,
  logsService: LogsService
): Promise<void> => {
  if (env.LOGS_CRON_OPTIONS === undefined) {
    server.log.info('LOGS_CRON_OPTIONS is not set, skipping cron registration')
    return
  }

  await server.register(logsCron, {
    logsCronOptions: env.LOGS_CRON_OPTIONS,
    logsService,
    notifier: createTelegramNotifier(env.LOGS_CRON_OPTIONS, env.SERVER_NAME),
    checkpointStore: createFileCheckpointStore(dataDir, lastLogsCheckFile)
  })
}

/** Composition root: builds the dependency graph from `env` and wires it into the Fastify app. */
export const buildServer = async (env: EchoBackEnv = defaultEnv): Promise<EchoServer> => {
  // Fastify's https/http overloads produce distinct FastifyInstance generics, which would
  // make `server` a union type unusable for the .register() calls below. The raw server type
  // is never introspected past this point, so the options are built once and typed as the
  // plain-http shape Fastify's default overload expects; `https` still drives TLS at runtime.
  const serverOptions = {
    logger: true,
    ...(env.TLS_OPTIONS && { https: env.TLS_OPTIONS })
  } as FastifyServerOptions<Server<typeof IncomingMessage, typeof ServerResponse>>

  const server = Fastify(serverOptions)

  server.setErrorHandler((error, request, reply) => {
    const echoError = normalizeToEchoError(error)
    request.log.error({ err: error }, echoError.message)
    reply.status(echoError.statusCode).send(echoError)
  })

  await registerSecurity(server, env)
  await registerDocumentation(server, env)

  server.addSchema(EchoErrorSchema)

  const filesService = createFilesService()

  const selfLogsWriter = env.SELF_LOGS_ENABLED
    ? await createSelfLogsWriter({
        logsDirPath: env.LOGS_DIR_PATH,
        serverName: env.SERVER_NAME,
        retentionDays: env.SELF_LOGS_RETENTION_DAYS,
        sessionJobId: await getNextSessionJobId(
          createFileSelfLogsSessionStore(dataDir, selfLogsSessionFile)
        ),
        logger: server.log
      })
    : createNoopSelfLogsWriter()

  const fileLogsRepository = createFileLogsRepository(
    env.LOGS_DIR_PATH,
    filesService,
    selfLogsWriter
  )
  const logsService = createLogsService(fileLogsRepository)

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  // API
  if (env.HAS_AUTHENTICATION) {
    const usersDb = openUsersDb(path.join(__dirname, '../../data/users.db'))
    const userRepository = createSqliteUsersRepository(usersDb)
    const authService = createAuthService(userRepository)
    await server.register(authRoutes, {
      prefix: '/api',
      controller: createAuthController(authService, env)
    })
  }
  await server.register(logsRoutes, {
    prefix: '/api',
    controller: createLogsController(logsService),
    hasAuthentication: env.HAS_AUTHENTICATION
  })

  await registerFrontend(server, path.join(__dirname, '../../echo_frontend/dist'))
  await registerLogsCron(server, env, logsService)

  return server
}

/** Entry point: builds the server with the real env and starts listening, exiting the process on failure. */
const startServer = async (): Promise<void> => {
  const server = await buildServer(defaultEnv)

  try {
    await server.listen({ port: defaultEnv.PORT, host: defaultEnv.HOST })

    console.log(`Api is accessible though ${defaultEnv.API_URL.toString()}`)
    console.log(`App is accessible though ${defaultEnv.APP_URL.toString()}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

void startServer()
