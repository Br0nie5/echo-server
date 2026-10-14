# @echo/utilities

What every part of Echo must agree on: the shapes the API exchanges, the configuration they share, and the way the logs are identified and filtered.

It runs in the browser as well as in Node.js, so it imports no built-in module of Node.js, and its only dependency is [zod](https://zod.dev).

## Using it

```ts
import { isLogMatchingSearch, parseLogSearchInput, type Log } from '@echo/utilities'

const searchFilters = parseLogSearchInput('message:error -groupName:billing')
const foundLogs = logs.filter((log: Log) => isLogMatchingSearch(log, searchFilters))
```

`src/index.ts` is the single barrel: import from `@echo/utilities`, never from an internal path. The package is built to `dist/`, which is what gets imported, so build it before using it.

It has no side effect when imported (`"sideEffects": false`), so a bundler leaves out what is not used.

## Contents

### Schemas and types

Each shape the API exchanges is a zod schema, its single source of truth, in a `schemas/` folder:

| Schema                | Type            | Describes                         |
| --------------------- | --------------- | --------------------------------- |
| `LogSchema`           | `Log`           | One entry of what was reported.   |
| `LogArraySchema`      | `Log[]`         | The answer of `GET /logs`.        |
| `LogLevelSchema`      | `LogLevel`      | The severity of a log.            |
| `GetLogsParamsSchema` | `GetLogsParams` | The query of `GET /logs`.         |
| `AuthStatusSchema`    | `AuthStatus`    | The answer of `GET /auth/status`. |
| `LoginRequestSchema`  | `LoginRequest`  | The body of `POST /auth/login`.   |
| `SignUpRequestSchema` | `SignUpRequest` | The body of `POST /auth/signup`.  |
| `EchoErrorSchema`     | `EchoError`     | The error the API answers with.   |

One schema gives three things:

```ts
import { z } from 'zod'
import { LogSchema, type Log } from '@echo/utilities'

const log: Log = LogSchema.parse(answer) // the type, inferred with z.infer, and the validation at runtime
const logJsonSchema = z.toJSONSchema(LogSchema) // its JSON schema
```

The type is never declared again. What a TypeScript type cannot say is in the schema: `z.int()` for a number without decimals, `z.iso.datetime()` for a text that must be a date.

`LogSchema` and `AuthStatusSchema` refuse a property they do not describe. The other ones leave it out of what they parse.

The `date` of a `Log` is an ISO 8601 date and time in UTC, the way `Date.toISOString` writes it (`2026-04-28T10:00:00.000Z`): `LogSchema` refuses any other text. The `fromDate` and `toDate` of `GetLogsParams` are ISO 8601 dates and times with their time zone, `Z` or an offset (`2026-04-28T12:00:00+02:00`), so `new Date` reads them as the same instant wherever it runs. The username and the password of `LoginRequestSchema` and `SignUpRequestSchema` are never empty.

`LogLevel` is also a value, holding the levels by name (`LogLevel.ERROR`), and `isLogLevel` tells whether a text is one of them.

The messages of the errors of `GetLogsParamsSchema` are written for the client, to be answered as they are: `Missing required field: fromDate`, `Field toDate is not a valid date, it should be an ISO string`, `DEBUG is not a valid log level, use SUCCESS|INFO|WARNING|ERROR`.

### Configuration

In `src/shared/config/`:

- `parseConfig` builds the `Config`, what every part of Echo shares (`serverName` from `SERVER_NAME`, `hasAuthentication` from `HAS_AUTHENTICATION`), from the variables as they were written, and throws when one is missing or not valid.
- `requireEnv`, `parseRequiredEnv`, `addEnvNameToError`, `parseBoolean` and `parseInteger` are what it reads a variable with, exported to read any other variable the same way.
- `apiRoutePrefix` and `appRoutePrefix` are the paths the API and the app are served under.

```ts
import { parseInteger, parseRequiredEnv } from '@echo/utilities'

const maxRetries = parseRequiredEnv(env, 'MAX_RETRIES', parseInteger)
// throws 'Missing required environment variable: MAX_RETRIES' when it is missing or blank,
// 'Invalid environment variable: MAX_RETRIES is neither a text, a number nor a boolean' when it is a list,
// and 'MAX_RETRIES: Invalid integer: many is not an integer' when it is 'many'
```

A parser of a single value (`parseBoolean`, `parseInteger`) takes its text and knows nothing of the name of its variable: `parseRequiredEnv` names it in the error. `parseInteger` refuses an integer beyond `Number.MAX_SAFE_INTEGER`, which could not be read exactly. The variables are given as a plain object, so they can come from the environment of a process as well as from a JSON file or from code, where a value may be a number or a boolean: it is read as its text.

### Logs

In `src/modules/logs/`:

- **Id.** `createLogId` creates the `id` of a log, a hash of 28 hexadecimal characters, short whatever the log holds, made from its date, its job, its `location`, `level`, `message` and `origin`, and a number telling apart the logs that have all of those in common.
- **Filtering.** `isLogMatchingLevels` and `isLogMatchingSearch` tell whether a log matches a filter, to keep it or leave it out. `parseLogSearchInput` turns what a user typed into the `LogSearchFilter`s the second one applies, and `logSearchableKeys` lists the fields a search can target, `LogSearchableKey` being one of them.

The search syntax `parseLogSearchInput` reads:

| Term              | Filter                                                                               |
| ----------------- | ------------------------------------------------------------------------------------ |
| `timeout`         | Keeps the logs holding `timeout` in any searchable field.                            |
| `message:timeout` | Keeps those holding it in that field, one of `logSearchableKeys`, in any case.       |
| `-timeout`        | Drops those holding it. A field can follow the dash.                                 |
| `"disk full"`     | Keeps those holding these words together. A space can also be escaped: `disk\ full`. |
| `"-12"`           | Keeps those holding `-12`: a quoted dash or field is searched for, like any text.    |
| `say\"hi`         | Keeps those holding `say"hi`: a backslash makes a double quote part of the text.     |
| `dir\\ logs`      | Keeps those holding `dir\` and `logs`: a backslash escapes another one.              |

A backslash before any other character is part of the text. A log is kept when it satisfies every term. Case is ignored, in the field names as in the text. The terms are separated by the space character only: a tab or a line break belongs to the term it is in.

## Commands

Run from this directory.

```bash
npm run build           # empties dist/, type-checks everything, then tsc to dist/, the tests left out (tsconfig.build.json)
npm run dev             # tsc to dist/ at each change of the sources, without emptying it nor checking the tests
npm run clean           # empties dist/
npm run types:check     # tsc on the sources, the tests and the config files (tsconfig.json), emitting nothing
npm run lint            # eslint --fix, Prettier included
npm run format          # prettier --write
npm run arch:check      # dependency-cruiser rules (.dependency-cruiser.mts)
npm run test            # vitest run
npm run test:coverage   # vitest run --coverage, 100% threshold
npm run test:watch
npm run open:coverage   # serves coverage/ on port 9001, until stopped, the cache off so a reload shows the latest run
```

`npm run arch:check` refuses:

- an import of a built-in module of Node.js, outside the tests;
- an import of anything outside this package but an installed package, whether relative or by the name of another package of the repository;
- an import of a module of `src/modules` by another one, and of anything outside `src/shared` by `src/shared`;
- an import of a test by the code it tests, and any circular import.

## Tests

Unit tests only, in a `__tests__` directory next to the code they test. They cover every case of each function and schema, as a table where the cases share a shape, and show how each one is used.
