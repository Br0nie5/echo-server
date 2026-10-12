# echo_backend

The server of Echo, a Fastify app in TypeScript (ESM). It reads `.jsonl` log files from the disk and serves them through a REST API, with an optional login, an optional cron notifying the problem logs through Telegram, and optional Swagger docs. It also serves a built web app, whose directory its config gives.

| Path             | Serves                                                                        |
| ---------------- | ----------------------------------------------------------------------------- |
| `/api`           | The API: `GET /logs` and, with the authentication, the four `/auth/*` routes. |
| `/app`           | The built web app, any unknown path under it answering its `index.html`.      |
| `/documentation` | Swagger UI, only when `HAS_DOCUMENTATION_ROUTE` is `true`.                    |

The root (`/`) redirects to `/app/`. Anything else answers a 404, as JSON. All of it can be served under a path of a domain behind a reverse proxy (`BASE_PATH`), whether the proxy forwards that path or strips it.

## Commands

Run from this directory.

```bash
npm run dev             # tsx watch src/main.ts, with .env.development
npm run build           # empties dist/, then tsc to it, the tests left out (tsconfig.build.json)
npm run start           # NODE_ENV=production node dist/main.js, with .env.production
npm run lint            # eslint --fix
npm run format          # prettier --write
npm run arch:check      # dependency-cruiser rules (.dependency-cruiser.mts)
npm run test:coverage   # vitest run --coverage, 100% threshold
npm run test:watch
```

## Configuration

Environment variables, read and validated once, when the server starts, by `loadBackConfig` (`src/shared/config/loadBackConfig.ts`). It throws on the first one that is missing or not valid, so a misconfigured server never starts.

- **The file.** `.env.production` is loaded when `NODE_ENV` is `production`, `.env.development` otherwise, from the working directory. A variable already set in the environment wins over the file.
- **No default in the code.** A variable is required unless being unset means something: `BASE_PATH`, `TRUSTED_PROXIES`, the TLS and the Telegram variables.
- **One parser per variable**, in `src/shared/config/utils/` (`parseHttpPort`, `parseBasePath`, `parseTrustedProxies`…), each with its unit tests.
- **Nothing else reads `process.env`.** `loadBackConfig` builds the `BackConfig` (`backConfig.ts`), which holds the paths, the file names and the limits too, and every part of the server is given the part of it that it needs.

`BackConfig` is split by what uses it:

| Part           | Holds                                                                                                                | Missing when                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `server`       | The port, the base path, the route prefixes, the trusted proxies, the TLS certificate, the directory of the web app. | Never.                                                   |
| `logs`         | The directories the logs are read from, the extension of a log file, and `logsNotifier`, the config of the cron.     | Never. `logsNotifier` is missing without `notification`. |
| `auth`         | The length of a session, its cookie, the limit of the login attempts, the file of the users database.                | `HAS_AUTHENTICATION` is `false`.                         |
| `selfReports`  | The retention, the directory and the files of the self reports.                                                      | `SAVE_SELF_REPORTS_TO_FILE` is `false`.                  |
| `notification` | The Telegram chat and bot.                                                                                           | `TELEGRAM_CHAT_ID` or `TELEGRAM_BOT_TOKEN` is unset.     |

A part that is missing is disabled, and its variables are not read: without `auth`, the server has no auth route and the logs are open.

## Layout

```
src/
  main.ts            the entry point: calls startServer
  server.ts          buildServer, the composition root, and startServer, which loads the config, builds the server and listens
  initializers/      what buildServer registers, one register* function per file, and their utils/
  modules/
    auth/            sign-up, login, check and logout, the SQLite users, the JWT of the session
    logs/            the logs API and the log files
      modules/logsNotifier/   the cron notifying the problem logs
    selfReport/      the diagnostics the server reports about itself, stored as logs
  shared/            the config, the services (FilesService, NotifierService), the error schema, the Logger type
  test/              the helpers of the tests: buildTestServer and mocks/
```

A module is split into the layer folders it needs, and holds nothing outside them:

| Folder          | Holds                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/`       | The models, and the contracts the module needs from the outside (`*.repository.ts`).                                                     |
| `application/`  | The use cases, one per file. They know nothing of HTTP, of Node.js or of Fastify.                                                        |
| `infra/`        | What implements the contracts: `*.api.ts` reads a data source, `dto/` describes it, `*.repository.ts` implements the contract with both. |
| `presentation/` | The routes, their handlers and their JSON schemas, or the cron.                                                                          |

Imports go `presentation → application → domain ← infra`. A module only imports the `domain/` and the `infra/` of another one. `server.ts` and `initializers/` are the one place building the `infra/` of the modules and handing it to their `presentation/`. `npm run arch:check` enforces all of it.

Three rules shape the code:

- **One access to the file system.** `FilesService` (`src/shared/services/files.service.ts`) is the only code that imports `fs`. `startServer` builds it once and hands it down. A write goes through a temporary file, so a reader never sees a file half written.
- **The JSON schemas of the routes are not written by hand.** They are converted from the zod schemas of `@echo/utilities`, in the `*.schemas.ts` files, and drive both the validation of the requests and the Swagger docs. Keep the `schema` of a route accurate, its `operationId` and its answers above all.
- **A self report never breaks what it reports about.** Whoever reports a diagnostic is given a `SelfReportRepository`, which stores it as a log, or stores nothing when the self reports are disabled, and never throws.

## How the logs are read

There is no database of logs: `GET /logs` reads the files at each request.

1. `infra/logsFiles.api.ts` lists the files with the log extension under the logs directories, at any depth, and reads their non-blank lines.
2. `infra/logsFiles.repository.ts` converts each line to a `Log`. A line that holds none, because it is not JSON, misses a field or has an unknown level or a date that is not one, becomes a warning self report instead.
3. `application/getFilteredLogs.ts` saves those self reports, then filters the logs by date, level and search, and sorts them from the newest to the oldest.

The group of a log is made of the directories of its file, and its ids are worked out from its content and its position: a line stores neither.

## Tests

The tests live in a `__tests__` directory next to the code they test. They reach neither the disk, the network nor a port, and set the clock when the code reads it.

- **The routes and the cron** are tested on the real server (`logs.routes.test.ts`, `auth.routes.test.ts`, `logs.notifier.test.ts`), with a few tests each, one per feature. `buildTestServer` (`src/test/`) builds it with `buildServer`, from a config with the authentication and nothing optional, which a test completes with the part it is about:

  ```ts
  const { server, fileSystem } = await buildTestServer({
    config: { auth: undefined },
    files: { '/logs/billing/logs/send_invoices.jsonl': logLine }
  })

  const response = await server.inject({ method: 'GET', url: '/api/logs', query: { fromDate } })
  ```

  Only the outside is replaced: the file system by one kept in memory (`createInMemoryFileSystem`), which the real `FilesService` runs on, the users database by an in-memory SQLite one, and `fetch`, stubbed, for the notifications. A test fills the files, sends requests with `server.inject` and reads the files back. The cron is only registered when a test configures it, and is run by moving the fake clock.

- **The server itself** (`src/__tests__/server.test.ts`) has unit tests of what is its own: the paths it serves, the documentation, the web app, CORS, the proxies, TLS and how it starts. The routes and the cron are mocked there, so a change in a module never changes that file. The initializers have no test of their own.
- **Everything else** has unit tests, covering every case: `shared/`, the `utils/` folders, the use cases, the `infra/` adapters and the DTOs. They get a `FilesService` whose methods are mocks from `getMockFilesService`, and a config from `src/test/mocks/mockConfigs.ts`.

The only files read from the disk are the fixtures of `src/__tests__/fixtures/`, the files `@fastify/static` serves in the tests of the server, as it reads the disk itself.
