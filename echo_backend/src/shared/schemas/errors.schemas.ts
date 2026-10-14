import { EchoErrorSchema } from '@echo/utilities'
import { z } from 'zod'

/** The `@echo/utilities` schemas every route may answer with, with the name the API gives them. */
const sharedApiSchemas = z.registry<{ id: string }>()
sharedApiSchemas.add(EchoErrorSchema, { id: 'EchoError' })

const { schemas } = z.toJSONSchema(sharedApiSchemas, {
  target: 'draft-7',
  // The schemas describe what the client receives, not what the server makes of it.
  io: 'input',
  // A schema is referred to by its name, which Fastify resolves against the schemas registered
  // with `addSchema`.
  uri: (id) => id
})

/**
 * JSON schema of the error the API answers with, generated from `EchoErrorSchema` of
 * `@echo/utilities`.
 *
 * Once registered with `addSchema`, a route refers to it with `{ $ref: 'EchoError#' }`.
 */
export const EchoErrorJsonSchema = schemas.EchoError
