import type { Server, IncomingMessage, ServerResponse } from 'http'

import type { FastifyBaseLogger, FastifyInstance, FastifyTypeProviderDefault } from 'fastify'

/** The Fastify instance type used by the server, with the plain-http generics. */
export type EchoServer = FastifyInstance<
  Server<typeof IncomingMessage, typeof ServerResponse>,
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  FastifyBaseLogger,
  FastifyTypeProviderDefault
>
