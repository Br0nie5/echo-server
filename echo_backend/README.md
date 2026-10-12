# echo_backend

The server of Echo: a Fastify API that reads `.jsonl` log files from disk and serves them under `/api`, with an optional login, an optional cron notifying the problem logs through Telegram, the built web app under `/app` and, when asked, Swagger docs under `/documentation`.

## Commands

Run from this directory.

```bash
npm run dev             # tsx watch, with .env.development
npm run build           # empties dist/, then tsc to it, the tests left out (tsconfig.build.json)
npm run start           # NODE_ENV=production node dist/main.js, with .env.production
npm run lint            # eslint --fix
npm run arch:check      # dependency-cruiser rules (.dependency-cruiser.mts)
npm run test:coverage   # vitest run --coverage, 100% threshold
npm run test:watch
```

## Configuration

Environment variables, read and validated once, at startup, by `loadBackConfig` (`src/shared/config/loadBackConfig.ts`). It builds the `BackConfig`, which every part of the server reads its settings, paths and file names from: nothing else reads `process.env`. A variable is required unless being unset means something, and each one has its own parser in `src/shared/config/utils/`. `.env.development` and `.env.production` hold the values for local work.

`BackConfig` is split by what uses it: `server`, `logs` and the optional `auth`, `selfReports` and `notification`. A part that is missing is disabled: without `auth`, the server has no auth route and the logs are open.

## Layout

```
src/
  main.ts            entry point: calls startServer
  server.ts          buildServer, the composition root, and startServer, which loads the config, builds the server and listens
  initializers/      what buildServer registers, one register* function per file, and their utils/
  modules/
    auth/            sign up, login, check and logout, the SQLite users, the JWT of the session
    logs/            the logs API and the log files
      modules/logsNotifier/   the cron notifying the problem logs
    selfReport/      the diagnostics the server reports about itself, stored as logs
  shared/            the config, the services (FilesService, NotifierService), the error schema, the Logger type, helpers
  test/              helpers of the tests: buildTestServer and mocks/
```

A module is split into the layer folders it needs, and holds nothing outside them: `domain/` (the contracts it needs from the outside), `application/` (the use cases), `infra/` (what implements the contracts) and `presentation/` (the routes, or the cron). Imports go `presentation → application → domain ← infra`, which `npm run arch:check` enforces.

Two rules shape the code:

- **One access to the file system.** `FilesService` (`src/shared/services/files.service.ts`) is the only code that imports `fs`. `startServer` builds it once and hands it down.
- **The JSON schemas of the routes are not written by hand.** They are converted from the zod schemas of `@echo/utilities`, in the `*.schemas.ts` files, and drive both the validation of the requests and the Swagger docs.

## Tests

Tests live in a `__tests__` directory next to the code they test. They reach neither the disk nor the network.

- **Routes and the cron** are tested through the real server. `buildTestServer` (`src/test/`) builds it with `buildServer` and a config for tests. Only the file system is replaced, by one kept in memory (`createInMemoryFileSystem`), which the real `FilesService` runs on, and the users database is an in-memory SQLite one. A test fills the files, sends requests with `server.inject` and reads the files back. The cron is not registered unless a test configures it: it is then run by moving the clock, and its HTTP calls go to a stubbed `fetch`.
- **The server itself** (`src/__tests__/server.test.ts`) has unit tests of what is its own: the paths it serves, the documentation, the frontend, CORS, the proxies, TLS and how it starts. The routes and the cron are mocked there, so a change in a module never changes that file.
- **Everything else** has unit tests: `shared/`, the `utils/` folders, the use cases and the `infra/` adapters, with a `FilesService` whose methods are mocks (`getMockFilesService`).

The only files read from the disk are the fixtures of `src/__tests__/fixtures/`, the assets `@fastify/static` serves, as it reads the disk itself.
