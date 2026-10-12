# @echo/utilities

What every part of Echo must agree on: the shapes the API exchanges, the configuration they share, and the way the logs are identified and filtered.

It runs in the browser as well as in Node.js, so it imports no built-in module of Node.js, and its only dependency is [zod](https://zod.dev).

## Using it

```ts
import { filterLogBySearch, parseLogSearchInput, type Log } from '@echo/utilities'

const searchFilters = parseLogSearchInput('message:error -groupName:billing')
const foundLogs = logs.filter((log: Log) => filterLogBySearch(log, searchFilters))
```

`src/index.ts` is the single barrel: import from `@echo/utilities`, never from an internal path. The package is built to `dist/`, which is what gets imported, so build it before using it.

It has no side effect when imported (`"sideEffects": false`), so a bundler leaves out what is not used.

## Contents

### Schemas and types

Each shape the API exchanges is a zod schema, its single source of truth, in a `schemas/` folder:

| Schema                | Type            | Describes                              |
| --------------------- | --------------- | -------------------------------------- |
| `LogSchema`           | `Log`           | One entry emitted by a watched script. |
| `LogArraySchema`      | `Log[]`         | The answer of `GET /logs`.             |
| `LogLevelSchema`      | `LogLevel`      | The severity of a log.                 |
| `GetLogsParamsSchema` | `GetLogsParams` | The query of `GET /logs`.              |
| `AuthTokenSchema`     | `AuthToken`     | The answer of every auth route.        |
| `LoginRequestSchema`  | `LoginRequest`  | The body of `POST /auth/login`.        |
| `SignUpRequestSchema` | `SignUpRequest` | The body of `POST /auth/signup`.       |
| `EchoErrorSchema`     | `EchoError`     | The error the API answers with.        |

One schema gives three things:

```ts
import { z } from 'zod'
import { LogSchema, type Log } from '@echo/utilities'

const log: Log = LogSchema.parse(answer) // the type, inferred with z.infer, and the validation at runtime
const logJsonSchema = z.toJSONSchema(LogSchema) // its JSON schema
```

The type is never declared again. What a TypeScript type cannot say is in the schema: `z.int()` for a number without decimals, `.meta({ format: 'date-time' })` for the format of a string.

`LogLevel` is also a value, holding the levels by name (`LogLevel.ERROR`), and `isLogLevel` tells whether a text is one of them.

The messages of the errors of `GetLogsParamsSchema` are written for the client, to be answered as they are. `getInvalidDateFieldMessage` gives the one of a date field that is not an ISO date, for whoever turns that text into a date.

### Configuration

In `src/shared/config/`:

- `parseConfig` builds the `Config`, the two variables every part of Echo shares (`SERVER_NAME`, `HAS_AUTHENTICATION`), from the variables as they were written, and throws when one is missing or not valid.
- `requireEnv`, `parseRequiredEnv`, `addEnvNameToError`, `parseBoolean` and `parseInteger` are what it reads a variable with, exported to read any other variable the same way.
- `apiRoutePrefix` and `appRoutePrefix` are the paths the API and the app are served under.

```ts
import { parseInteger, parseRequiredEnv } from '@echo/utilities'

const maxRetries = parseRequiredEnv(env, 'MAX_RETRIES', parseInteger)
// throws 'Missing required environment variable: MAX_RETRIES' when it is missing or blank,
// and 'MAX_RETRIES: Invalid integer: many is not an integer' when it is 'many'
```

A parser of a single value (`parseBoolean`, `parseInteger`) takes its text and knows nothing of the name of its variable: `parseRequiredEnv` names it in the error. The variables are given as a plain object, so they can come from the environment of a process as well as from a JSON file, where a value may be written as a number or a boolean.

### Logs

In `src/modules/logs/`:

- **Ids.** `createLogWithIds` gives a log its two ids. Its `contentId` (`createLogContentId`) is made of its `location`, `level`, `message` and `origin`: two logs saying the same thing share it, whatever their date and their job. Its `id` (`createLogId`) adds the date, the job and a number telling apart the logs that have all of those in common.
- **Filtering.** `filterLogByLevels` and `filterLogBySearch` tell whether a log is kept. `parseLogSearchInput` turns what a user typed into the `LogSearchFilter`s the second one applies, and `logSearchableKeys` lists the fields a search can target.

The search syntax `parseLogSearchInput` reads:

| Term              | Filter                                                                               |
| ----------------- | ------------------------------------------------------------------------------------ |
| `timeout`         | Keeps the logs holding `timeout` in any searchable field.                            |
| `message:timeout` | Keeps those holding it in that field, one of `logSearchableKeys`.                    |
| `-timeout`        | Drops those holding it. A field can follow the dash.                                 |
| `"disk full"`     | Keeps those holding these words together. A space can also be escaped: `disk\ full`. |

A log is kept when it satisfies every term. Case is ignored.

### Auth

`needsSignupMessage` (`src/modules/auth/`) is the message of the 401 answer of the auth check when no account exists yet, which tells it from the 401 of a missing session.

## Commands

Run from this directory.

```bash
npm run build           # empties dist/, then tsc to it, the tests left out (tsconfig.build.json)
npm run dev             # the same build, watching the sources
npm run lint            # eslint --fix
npm run format          # prettier --write
npm run arch:check      # dependency-cruiser rules (.dependency-cruiser.mts)
npm run test:coverage   # vitest run --coverage, 100% threshold
npm run test:watch
```

`npm run arch:check` refuses an import of a built-in module of Node.js.

## Tests

Unit tests only, in a `__tests__` directory next to the code they test. They cover every case of each function and schema, as a table where the cases share a shape, and show how each one is used.
