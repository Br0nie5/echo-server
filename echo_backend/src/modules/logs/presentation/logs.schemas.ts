import { GetLogsParamsSchema, LogCategorySchema, LogSchema } from '@echo/utilities'
import { z } from 'zod'

/** The `@echo/utilities` schemas the logs routes expose, with the name the API gives them. */
const logsApiSchemas = z.registry<{ id: string }>()
logsApiSchemas.add(LogCategorySchema, { id: 'LogCategory' })
logsApiSchemas.add(LogSchema, { id: 'Log' })
logsApiSchemas.add(GetLogsParamsSchema, { id: 'GetLogsParams' })

const { schemas } = z.toJSONSchema(logsApiSchemas, {
  target: 'draft-7',
  // The schemas describe what the client sends and receives, not what the server makes of it.
  io: 'input',
  // A schema refers to another one by its name, which Fastify resolves against the schemas
  // registered with `addSchema`.
  uri: (id) => id
})

/**
 * JSON schema of a log category, generated from `LogCategorySchema` of `@echo/utilities`.
 *
 * Once registered with `addSchema`, a route refers to it with `{ $ref: 'LogCategory#' }`.
 */
export const LogCategoryJsonSchema = schemas.LogCategory

/**
 * JSON schema of a log, generated from `LogSchema` of `@echo/utilities`.
 *
 * Once registered with `addSchema`, a route refers to it with `{ $ref: 'Log#' }`. It refers itself
 * to `LogCategoryJsonSchema`, which has to be registered too.
 */
export const LogJsonSchema = schemas.Log

/**
 * JSON schema of the query of `GET /logs`, generated from `GetLogsParamsSchema` of `@echo/utilities`.
 *
 * It refers to `LogCategoryJsonSchema`, which has to be registered with `addSchema`.
 */
export const GetLogsParamsJsonSchema = schemas.GetLogsParams
