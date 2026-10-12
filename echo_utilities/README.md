# @echo/utilities

What every part of Echo must agree on: the shapes the API exchanges, the configuration they share and the way the logs are filtered.

## Contents

- **Schemas and types** (`src/**/schemas/`): each shape the API exchanges is a zod schema, its single source of truth. The type is inferred from it (`z.infer`), never declared again; the schema validates a value at runtime, and `z.toJSONSchema` gives its JSON schema. What a TypeScript type cannot say is in the schema: `z.int()`, `.meta({ format: 'date-time' })`.
  - Logs: `LogSchema`, `LogArraySchema`, `LogLevelSchema` and `GetLogsParamsSchema`, the query of `GET /logs`.
  - Auth: `AuthTokenSchema`, `LoginRequestSchema` and `SignUpRequestSchema`.
  - Errors: `EchoErrorSchema`.
- **Configuration** (`src/shared/config/`): `parseConfig` builds the `Config` (`SERVER_NAME`, `HAS_AUTHENTICATION`) from the variables as they were written. What it reads a variable with is exported, to read any other variable the same way: `requireEnv`, `parseRequiredEnv`, `addEnvNameToError`, `parseBoolean` and `parseInteger`. A parser of a single value takes its text and knows nothing of the name of its variable. `apiRoutePrefix` and `appRoutePrefix` are the paths the API and the app are served under.
- **Logs** (`src/modules/logs/`):
  - Ids: `createLogWithIds` gives a log its `id` (`createLogId`) and its `contentId` (`createLogContentId`), which two logs saying the same thing share.
  - Filtering: `filterLogByLevels` and `filterLogBySearch` tell whether a log is kept, and `parseLogSearchInput` turns what the user typed in the search field into the filters `filterLogBySearch` applies. `logSearchableKeys` lists the fields a search can target.
- **Auth** (`src/modules/auth/`): `needsSignupMessage`, the message of the 401 answer of the auth check when no account exists yet.

## Using it

```ts
import { filterLogBySearch, parseLogSearchInput, type Log } from '@echo/utilities'

const searchFilters = parseLogSearchInput('message:error -groupName:billing')
const foundLogs = logs.filter((log: Log) => filterLogBySearch(log, searchFilters))
```

`src/index.ts` is the single barrel export: import from `@echo/utilities`, never from an internal path. The package is built to `dist/`, which is what gets imported, so build it before using it.

It runs in the browser as well as in Node.js, so it imports no built-in module of Node.js (`npm run arch:check` refuses it). It has no side effect when imported (`"sideEffects": false`), so a bundler can leave out what is not used.

## Commands

Run from this directory.

```bash
npm run build           # tsc, to dist/
npm run dev             # tsc --watch
npm run lint            # eslint --fix
npm run arch:check      # dependency-cruiser rules (.dependency-cruiser.mts)
npm run test:coverage   # vitest run --coverage, 100% threshold
npm run test:watch
```

## Tests

Unit tests, in a `__tests__` directory next to the code they test. They cover every case of each function and schema, and show how each one is used.
