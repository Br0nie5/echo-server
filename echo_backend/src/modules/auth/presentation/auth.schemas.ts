import { AuthStatusSchema, LoginRequestSchema, SignUpRequestSchema } from '@echo/utilities'
import { z } from 'zod'

/** The `@echo/utilities` schemas the auth routes expose, with the name the API gives them. */
const authApiSchemas = z.registry<{ id: string }>()
authApiSchemas.add(AuthStatusSchema, { id: 'AuthStatus' })
authApiSchemas.add(LoginRequestSchema, { id: 'LoginRequest' })
authApiSchemas.add(SignUpRequestSchema, { id: 'SignUpRequest' })

const { schemas } = z.toJSONSchema(authApiSchemas, {
  target: 'draft-7',
  // The schemas describe what the client sends and receives, not what the server makes of it.
  io: 'input',
  // A schema is referred to by its name, which Fastify resolves against the schemas registered
  // with `addSchema`.
  uri: (id) => id
})

/**
 * JSON schema of the answer of `GET /auth/status`, generated from `AuthStatusSchema` of
 * `@echo/utilities`.
 *
 * Once registered with `addSchema`, a route refers to it with `{ $ref: 'AuthStatus#' }`.
 */
export const AuthStatusJsonSchema = schemas.AuthStatus

/**
 * JSON schema of the body of `POST /auth/login`, generated from `LoginRequestSchema` of
 * `@echo/utilities`.
 *
 * Once registered with `addSchema`, a route refers to it with `{ $ref: 'LoginRequest#' }`.
 */
export const LoginRequestJsonSchema = schemas.LoginRequest

/**
 * JSON schema of the body of `POST /auth/signup`, generated from `SignUpRequestSchema` of
 * `@echo/utilities`.
 *
 * Once registered with `addSchema`, a route refers to it with `{ $ref: 'SignUpRequest#' }`.
 */
export const SignUpRequestJsonSchema = schemas.SignUpRequest
