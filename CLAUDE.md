# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Echo (repo name "echo-server") is a self-hosted log-viewing app: a Fastify backend that watches a directory of `.jsonl` log files and serves them through a REST API, and a React frontend that displays/filters them. Optional cookie/JWT authentication and an optional cron job that pushes problem logs to Telegram.

npm workspaces monorepo with three packages:
- `echo_backend` — Fastify API server (TypeScript, ESM, Node)
- `echo_frontend` — React 19 + MUI + TanStack Query app, served by the backend under `/app` in production, by Vite in dev
- `echo_utilities` — `@echo/utilities`, a shared package (built to `dist`) consumed by both backend and frontend for types, env parsing, and log-filtering logic that must stay identical client/server-side

## Commands

Run from the repo root unless noted. Per-workspace commands can be targeted with `--workspace=echo_backend` / `echo_frontend` / `echo_utilities`.

```bash
npm run dev              # runs backend (tsx watch) + frontend (vite) concurrently
npm run build             # builds all three workspaces (utilities must build before backend/frontend can type-check against it)
npm run lint               # eslint --fix across all workspaces
npm run format              # prettier --write across all workspaces
npm run test:coverage        # vitest run --coverage (100% threshold) across all workspaces
npm run open:coverage         # open each workspace's coverage/index.html
npm run dead-code:check        # knip: unused files, exports and dependencies, all workspaces at once (knip.json)
```

Single test file / watch mode (run inside the relevant workspace dir, e.g. `cd echo_backend`):
```bash
npx vitest run src/modules/logs/application/__tests__/getFilteredLogs.test.ts
npx vitest --watch
```

Docker:
```bash
npm run build:docker    # builds workspaces, rebuilds the `echo` image
npm run start:docker     # builds + runs the container, mounting ./test_logs -> /watched_logs and ./data -> /app/data
npm run deploy:server      # multi-arch build & push to ghcr.io/br0nie5/echo:latest
```

`lefthook.yml` runs `build`, `format`, `lint`, and `test:coverage` (all workspaces, sequentially) as a pre-commit hook — expect commits to be slow and to fail if coverage drops below 100%.

## Architecture

### Type flow: zod schema → shared type and route schema

The types the API exchanges are **not** hand-written, and no file is generated. Each one is a zod schema in `echo_utilities`, its single source of truth: `LogSchema`, `LogCategorySchema` and `GetLogsParamsSchema` (the query of `GET /logs`) in `src/modules/logs/schemas/`, `AuthTokenSchema`, `LoginRequestSchema` and `SignUpRequestSchema` in `src/modules/auth/schemas/`, `EchoErrorSchema` in `src/shared/schemas/`.

1. The type is inferred from the schema (`z.infer`), never redeclared. What a TypeScript type cannot say goes in the zod schema: `z.int()`, `.meta({ format: 'date-time' })`.
2. In `echo_backend`, a `*.schemas.ts` file converts the zod schemas to the JSON schemas the routes use with `z.toJSONSchema`, when the server starts: `presentation/logs.schemas.ts`, `presentation/auth.schemas.ts` and `shared/schemas/errors.schemas.ts`. To expose another zod schema, add it to the registry of one of them.

`echo_utilities/src/index.ts` is the single barrel export — both backend and frontend import everything from `@echo/utilities`, never by reaching into its internal paths.

### Module layout convention (backend and frontend)

Both `echo_backend/src/modules` and `echo_frontend/src/modules` are split by domain (`auth`, `logs`, and `notification` and `selfReport` on the backend only).

The backend modules are split into layer folders, with imports only going `presentation → application → domain ← infra` (enforced by `npm run arch:check`). A module keeps only the layers it needs. In the core of the `logs` module, which has the four of them:
- `domain/` — the contracts the module needs from the outside (`logs.repository.ts`); the models (`Log`, `LogCategory`) are imported from `@echo/utilities`
- `application/` — the business rules, one file per use case, named after it (`getFilteredLogs.ts`), which know nothing of HTTP
- `infra/` — `*.api.ts` reads a data source, `dto/*.dto.ts` describes what it returns (with the function converting it to a model next to it), `*.repository.ts` implements a `domain/` contract with both
- `presentation/` — `*.routes.ts`, `*.controller.ts` (the request handlers, calling into `application/`), `utils/` (pure helpers, such as the validation of the input of the handlers), and `*.schemas.ts`, the JSON schemas of the routes, derived from the zod schemas of `@echo/utilities`

`GetLogsParamsSchema` describes the query as the client sends it; `safeParseGetLogsParams` (`presentation/utils/`) validates it and turns it into what `getFilteredLogs` needs (`fromDate` as a `Date`, `logCategories` always an array).

`logs/modules/logsNotifier/` is the submodule of `logs`, layered the same way, with the four layers. It is the optional cron that notifies the problem logs: `domain/` holds the `LastCheckDate` model and the `CheckDateRepository` contract (the date the logs were last checked at); `application/checkProblemLogsAndNotify.ts` is the use case, built on the `getFilteredLogs` of `logs`, with `application/utils/buildNotifierMessage.ts` writing the message it notifies, never longer than the size limit the use case asks the notifier for (it returns `undefined` when nothing fits, in which case nothing is sent and the use case saves a warning to its own `SelfReportRepository`, stored in `logsNotifier.jsonl`); `infra/` holds `CheckDateApi` (the last-check file), `fileCheckDate.repository.ts` implementing the contract on top of it, and `dto/lastCheckDate.dto.ts`; `presentation/logs.notifier.ts` is the Fastify plugin scheduling the use case. A cron is the entry point of the submodule the way a route is the one of `logs`, hence `presentation/`. It notifies through the `Notifier` of the `notification` module.

`echo_backend/src/plugins/` holds what `buildServer` registers on the Fastify app, one `register*` function per file: `registerSecurity` (cookie/JWT and CORS), `registerDocumentation` (Swagger), `registerAuthRoutes` and `registerLogsRoutes` (the routes of the API, under `apiRoutePrefix`), `registerFrontend` (the static files, under `appRoutePrefix`, and the 404 handler) and `registerLogsNotifier` (the cron), with `utils/` holding what `server.ts` shares with them or uses on its own (`getSelfReportRepository.ts`, `normalizeToEchoError.ts`, `isOriginAllowed.ts`). They are part of the composition root, so they import the `infra/` and `presentation/` of the modules. Each one is tested in `plugins/__tests__/` on a real Fastify instance, while `src/__tests__/server.test.ts` mocks them, and only checks that `buildServer` registers each one once and that `startServer` listens (only `main.ts` is excluded from the coverage), through `server.inject`, with a config from `test/mocks/configs.ts` (`getMockBackConfig`, `getMockServerConfig`).

The backend `notification` module is how the backend sends a message to the outside. It has `domain/` and `infra/` only: `domain/notifier.ts` holds the `Notifier` contract, which gives the size limit of its messages (`getMessageSizeLimit`) and sends one (`notify`); `infra/` holds `TelegramNotifierApi` (the Telegram bot API) and `telegramNotifier.ts`, implementing the contract on top of it with the `telegramMessageSizeLimit` of the config. A module or a submodule may import the `domain/` of any other one, and only its `infra/` may import the `infra/` of another one; the `application/` and the `presentation/` of a module or a submodule stay its own. That holds between a module and its submodules too, in both directions, and between the submodules of a module, with one exception: the `application/` of a submodule may import the `application/` of its parent (`logsNotifier` builds on `getFilteredLogs`). See `backend-modules-isolated`, `backend-parent-not-to-submodule-internals`, `backend-submodules-isolated` and `backend-submodule-not-to-parent-internals` in `.dependency-cruiser.mts`.

The backend `selfReport` module is how the backend reports its own diagnostics. It has `domain/` and `infra/` only (it has no route and no business rule of its own): `domain/` holds the `SelfReport` model (`date`, `message`, `level` (`'warning'` or `'error'`), `reportedFile`, `reportedLine`), which is not derived from `Log`, and the `SelfReportRepository` contract the other parts of the backend report through; `infra/` holds `SelfFileReportRepository` (the contract on top of the `LogsFilesApi` of `logs`, writing each self report as a log line of a `.jsonl` file of `SERVER_LOGS_DIR_PATH/self_reports/<SERVER_NAME>/log`, a directory the logs are read from too, so it is read back like any other log), `SessionJobIdApi` (the session file, remembering the last `job_id` the self reports were written with: a repository takes the next one when it is created) and `dto/sessionJobId.dto.ts`. A `SelfFileReportRepository` is created for one file, by `getSelfReportRepository` (`plugins/utils/`), which gives a repository storing nothing when there is no `SelfReportsConfig`: whoever needs to report is given its own `SelfReportRepository` and never names a file. `logs` and `selfReport` import each other, which the rule allows: `logs` the `domain/` of `selfReport`, `selfReport` the `infra/logsFiles.api.ts` and the `infra/dto/rawJsonLog.dto.ts` of `logs`.

The backend `auth` module has `domain/`, `infra/` and `presentation/`, and no `application/`: it has no use case of its own yet, its handlers call the contract of `domain/` directly.
- `domain/auth.repository.ts` — the `AuthRepository` contract: whether a sign up is needed (`needsSignup`), the sign up of the first admin (`signUpFirstAdmin`), the check of credentials (`areCredentialsValid`)
- `infra/` — `users.db.ts` (`createUsersDb`) opens the SQLite database, `dto/user.dto.ts` describes a row of its `users` table, `authUsersDb.repository.ts` implements the contract by querying that database, hashing the passwords with bcrypt
- `presentation/` — `auth.routes.ts`, `auth.controller.ts` (the request handlers, signing the JWT and setting the session cookie), `auth.schemas.ts` (the JSON schemas of the routes, derived from the zod schemas of `@echo/utilities`) and `auth.hooks.ts`, the `authPreHandler` rejecting the requests without a valid JWT. No other module imports it: `plugins/registerLogsRoutes.ts` hands it to the routes to protect as their `preHandler` option (`logsRoutes`), only when authentication is enabled

The frontend modules are layered like the backend ones, with imports only going `presentation → application → infra → domain` (enforced by `npm run arch:check`): there is no injection, so `application/` imports the hook or the function of `infra/` directly, where the backend goes through the contract of `domain/`.

The frontend `logs` module:
- `domain/` — the contract the module needs from the outside: `logs.repository.ts`, the `LogsRepository`, which fetches the logs (`findLogs`) and gives those matching the category and search filters, wherever they are filtered (`filterLogs`); the models (`Log`, `LogCategory`) are imported from `@echo/utilities`
- `infra/` — `useLogsRepository.ts`, the hook giving the `LogsRepository`: `findLogs` on top of the logs endpoint of the backend (it sends the request, validates the answer against `LogArraySchema` and sends the user to the auth screen on a 401), `filterLogs` on top of the Web Worker of `workers/`. The worker is one way to implement `filterLogs`, which filtering on the main thread or through the API would be others. In `workers/`: `filterWorkerMessages.ts` types the messages both sides exchange, `filterLogs.ts` wraps the worker into a promise-returning function (one request at a time, the logs sent only when they change, indexes sent back so the logs keep their identity, a rejection when the request is aborted or the worker fails), `createFilterWorkerRequestHandler.ts` is what the worker does with a request, and `filterWorker.ts`, its entry point, is the only file excluded from the coverage
- `application/` — the TanStack Query hooks: `useGetLogs` and `useFilteredLogs` (debounced, and cancelled when its filters change before it ends). There is no query key file: each query key is written in its hook
- `presentation/` — `LogsScreen`, plus its `hooks/`, `layouts/`, `components/` and `utils/` (the grouping of the logs by day, group and job, the log categories to offer, the `fromDate` query param)

The frontend `auth` module:
- `domain/` — the `AuthRepository` contract (`checkAuthentication`, `login`, `signUp`) and, in the same file, what it gives and throws: `AuthCheckResult` and `InvalidCredentialsError`
- `infra/useAuthRepository.ts` — the hook giving the `AuthRepository` on top of the auth endpoints of the backend: it sends the requests, validates the answers against `AuthTokenSchema` and turns the 401 of the backend into the `AuthCheckResult` of the auth check (`login` or `signUp`) and into the `InvalidCredentialsError` of the login, so that no layer above it reads an HTTP status or an axios error
- `application/` — the TanStack Query hooks: `useGetAuthCheck`, `usePostLogin` and `usePostSignUp`, the two mutations
- `presentation/` — `AuthScreen`, which shows one of two layouts after the auth check: `AuthFormLayout`, the credentials form of the login or of the sign up depending on its `formMode` (`useAuthForm` holds its state, submits with the mutation of that mode, alerts the outcome and redirects), or `RedirectLayout`. `hooks/useRedirectionOnAuth.ts` says where to go once authenticated

`shared/` in each workspace holds cross-module code (the config, API client setup, i18n, layouts, generic components).

### Environment configuration

Env vars are parsed and validated once at startup, not read ad hoc via `process.env` elsewhere in the code:
- `parseConfig` (`echo_utilities/src/shared/config/parseConfig.ts`) parses the vars common to both frontend and backend into the `Config` (`shared/config/config.ts`): `SERVER_NAME`, `SERVER_URL`, and `HAS_AUTHENTICATION` are read directly; `API_URL` and `APP_URL` are derived from `SERVER_URL` (`${SERVER_URL}/api` and `${SERVER_URL}/app`) rather than being separate env vars, since the backend serves both the API and the built frontend under one origin.
- `echo_backend/src/shared/config/loadBackConfig.ts` builds the `BackConfig` (`shared/config/backConfig.ts`) from that, the backend-only vars and constants, and throws on startup if required vars are missing/invalid. Each variable is read by its own parser, one per file in `shared/config/utils/` (`parseHttpPort`, `parseTlsConfig`, `parseLogsNotifierConfig`, …): what a variable gives when it is unset, invalid or set to a given value is unit-tested there, while the tests of `loadBackConfig` only cover which env file is loaded, that the error of a parser is thrown, and the whole config compared to the expected one. It loads `.env.production` or `.env.development` based on `NODE_ENV`. `BackConfig` is split by what uses it: `server` (`ServerConfig`: `serverName`, URLs, `apiRoutePrefix` and `appRoutePrefix` (the paths of `apiUrl` and `appUrl`), `host`, `port` (from `HTTP_PORT`), `allowedDomain` (derived from `SERVER_URL`), optional `tls`, `frontendDistDirPath`), `auth` (`AuthConfig`: `hasAuthentication`, cookie config, `usersDbFilePath`), `logs` (`LogsConfig`: `logsDirsPaths` (`LOGS_DIR_PATH`, then `SERVER_LOGS_DIR_PATH` when the self reports are enabled), `logFileExtension`, and the optional `logsNotifier` (`LogsNotifierConfig`: schedule, watched categories, timezone, last-check file)), the optional `selfReports` (`SelfReportsConfig`, left out unless `SELF_REPORTS_ENABLED` is `true`: `retentionDays`, the self-reports directory (under `SERVER_LOGS_DIR_PATH`, which is always required), the names of its files, the session file) and the optional `notification` (`NotificationConfig`: `telegramChatId`, `telegramBaseUrl`, `telegramMessageSizeLimit`).
- Paths and file names are part of the config too (the `data/` directory and its files, the self-reports directory, the `.jsonl` extension of the log files, `parseLogFile.jsonl`): no module builds a path from `import.meta.url` or declares a file name of its own. A function takes the config of its domain (`createLogsFilesApi(config.logs)`, `createFileSessionJobIdApi(config.selfReports)`, `createTelegramNotifierApi(config.notification)`), and a value needed in two places is in both configs (`serverName`). `buildServer` (`server.ts`) receives the `BackConfig` and hands the parts down; `startServer`, next to it, builds the server and starts listening, and `main.ts`, the entry point, only calls it. Tests get a config from `test/mocks/configs.ts`.
- `echo_frontend/src/shared/config/utils/parseFrontConfig.ts` builds the `FrontConfig` (`shared/config/frontConfig.ts`), which `useConfig` gives: the `Config`, plus the frontend-only `LOGS_INITIAL_DATE_DAYS_AGO` (how many days back the logs start by default) and `LOGS_MINIMAL_DATE_DAYS_AGO` (how many days back they can start at most), each read by `parseDaysAgo`, next to it. It throws if one is missing or invalid, or if the first is greater than the second. `docker-entrypoint.sh` defaults them to `2` and `14`.
- The frontend fetches its runtime env from a generated `env.<mode>.json` file (see `docker-entrypoint.sh`, which writes `env.production.json` from container env vars at container start — this is how the same built frontend bundle is reconfigured per deployment without rebuilding). In dev, the frontend runs on a different port than the backend (Vite on `:5173` vs the API on `:4000`), so `echo_frontend/vite.config.ts` proxies `/api` and `/documentation` to the backend — keeping `SERVER_URL` a single origin (`http://localhost:5173`) in development too.
- `HAS_AUTHENTICATION=false` disables cookie/JWT registration and the `auth` routes entirely (see `registerSecurity.ts` and `registerAuthRoutes.ts` in `echo_backend/src/plugins/`); the frontend must handle both modes.
- The optional Telegram cron (`echo_backend/src/modules/logs/modules/logsNotifier/presentation/logs.notifier.ts`) only registers if `config.logs.logsNotifier` and `config.notification` are set (the first is left out when the second is), that is if `LOGS_NOTIFIER_SCHEDULE_REGEX`, `LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES`, `TELEGRAM_CHAT_ID`, and `TELEGRAM_BASE_URL` are all present and valid; it tracks last-checked time in `data/last_logs_check.json`.

### Log storage and parsing

Logs are read directly from `.jsonl` files on disk (the directories of `logsDirsPaths`: `LOGS_DIR_PATH`, and `SERVER_LOGS_DIR_PATH` when the self reports are enabled), not from a database — `infra/logsFiles.api.ts` is the one access to the log files: it walks each directory and reads the lines of each file, and writes the lines of the files the backend stores its own self reports in; `infra/logsFiles.repository.ts` converts each line to a log (`convertRawLogLineToLog` in `infra/dto/rawLogLine.dto.ts`) to implement the `LogsRepository` of `domain/`, and `getFilteredLogs` (`application/getFilteredLogs.ts`) filters them and sorts them from the newest to the oldest, in memory. `filterLogByCategories` / `filterLogBySearch` (in `@echo/utilities`, shared with the frontend) implement the actual filter logic so backend filtering and frontend live-filtering (`echo_frontend/src/modules/logs/infra/workers/createFilterWorkerRequestHandler.ts`, run in a Web Worker) stay in sync.

### Auth

Backend stores users in a local SQLite file at `data/users.db` (`echo_backend/src/modules/auth/infra/users.db.ts`, `better-sqlite3`) with bcrypt-hashed passwords. JWT secret is a fresh random value generated at process start (`crypto.randomBytes` in `plugins/registerSecurity.ts`) — sessions do not survive a server restart. The JWT is delivered via an httpOnly cookie whose domain/security options are derived from `APP_URL` (itself derived from `SERVER_URL`) at startup (`parseAllowedDomain` and `parseCookieSerializeOptions` in `shared/config/utils/`).

### Serving frontend from backend

In production the backend serves the built frontend static files (`echo_frontend/dist`) under `/app` via `@fastify/static` (`plugins/registerFrontend.ts`), with a catch-all `notFoundHandler` returning `index.html` for any `/app/*` route (SPA routing) and a JSON 404 for everything else. API routes are mounted under `/api`.

### Swagger / OpenAPI

`@fastify/swagger` + `@fastify/swagger-ui` are registered in `plugins/registerDocumentation.ts` and serve live docs at `/documentation`. Keep route `schema` blocks (especially `operationId`, request/response shapes) accurate, since they drive these docs.

## Testing

Vitest is used in all three workspaces with 100% coverage thresholds enforced by `test:coverage` (see each `vitest.config.ts` for exclude lists — the entry points are excluded). Tests live in `__tests__` (or `__test__`) directories colocated with the code under test.
