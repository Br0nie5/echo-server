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
npm run generate:types          # regenerate openApi.json, then the @echo/utilities types from it via orval (see below)
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

### Type flow: backend → OpenAPI → shared types

The `auth` request types (`LoginRequest`, `SignUpRequest`, …) and `EchoError` are **not** hand-written. The flow is one-directional:

1. Fastify routes in `echo_backend` declare JSON schemas (`*.schemas.ts`) inline in `server.route({ schema: ... })`.
2. `scripts/export_open_api.ts` boots the server and dumps `openApi.json` at the repo root.
3. `orval` (config in `orval.config.ts`) generates TypeScript types from `openApi.json` into a temporary `__generated__/` folder.
4. `scripts/generate_types.sh` moves the generated files into `echo_utilities/src/**/__generated__/` (orval skips `Log` and `LogCategory`, see `filters` in `orval.config.ts`, and the `GetLogsParams` it generates is left behind: the three come from zod schemas, see below), then lints/formats/builds `echo_utilities`.

Run the whole pipeline with `npm run generate:types` after changing a backend route's request/response schema or a zod schema of the logs module (see the module layout below), so `openApi.json` stays up to date. Never hand-edit files under `__generated__/`. `echo_utilities/src/index.ts` is the single barrel export — both backend and frontend import everything from `@echo/utilities`, never by reaching into its internal paths.

### Module layout convention (backend and frontend)

Both `echo_backend/src/modules` and `echo_frontend/src/modules` are split by domain (`auth`, `logs`, and `notification` and `selfReport` on the backend only).

The core of the backend `logs` module is split into four layer folders, with imports only going `presentation → application → domain ← infra` (enforced by `npm run arch:check`):
- `domain/` — the contracts the module needs from the outside (`logs.repository.ts`); the models (`Log`, `LogCategory`) are imported from `@echo/utilities`
- `application/` — the business rules, one file per use case, named after it (`getFilteredLogs.ts`), which know nothing of HTTP
- `infra/` — `*.api.ts` reads a data source, `dto/*.dto.ts` describes what it returns (with the function converting it to a model next to it), `*.repository.ts` implements a `domain/` contract with both
- `presentation/` — `*.routes.ts`, `*.controller.ts` (the request handlers, calling into `application/`), `utils/` (pure helpers, such as the validation of the input of the handlers), and `*.schemas.ts`, the JSON schemas of the routes, derived from the zod schemas of `@echo/utilities`

`Log`, `LogCategory` and `GetLogsParams` (the query of `GET /logs`) are the exception to the type flow above: each is a zod schema in `echo_utilities/src/modules/logs/schemas/` (`LogSchema`, `LogCategorySchema`, `GetLogsParamsSchema`), its single source of truth. The type is inferred from it (`z.infer`), never redeclared, and `presentation/logs.schemas.ts` converts it to the JSON schema the routes use with `z.toJSONSchema`, when the server starts: no file is generated. What a TypeScript type cannot say goes in the zod schema: `z.int()`, `.meta({ format: 'date-time' })`. `GetLogsParamsSchema` describes the query as the client sends it; `safeParseGetLogsParams` (`presentation/utils/`) validates it and turns it into what `getFilteredLogs` needs (`fromDate` as a `Date`, `logCategories` always an array). To expose another zod schema, add it to the registry of `logs.schemas.ts`.

`logs/modules/logsNotifier/` is the submodule of `logs`, layered the same way, with the four layers. It is the optional cron that notifies the problem logs: `domain/` holds the `LastCheckDate` model and the `CheckDateRepository` contract (the date the logs were last checked at); `application/checkProblemLogsAndNotify.ts` is the use case, built on the `getFilteredLogs` of `logs`, with `application/utils/buildNotifierMessage.ts` writing the message it notifies, never longer than the size limit the use case asks the notifier for (it returns `undefined` when nothing fits, in which case nothing is sent and the use case saves a warning to its own `SelfReportRepository`, stored in `logsNotifier.jsonl`); `infra/` holds `CheckDateApi` (the last-check file), `fileCheckDate.repository.ts` implementing the contract on top of it, and `dto/lastCheckDate.dto.ts`; `presentation/logs.notifier.ts` is the Fastify plugin scheduling the use case. A cron is the entry point of the submodule the way a route is the one of `logs`, hence `presentation/`. It notifies through the `Notifier` of the `notification` module.

The backend `notification` module is how the backend sends a message to the outside. It has `domain/` and `infra/` only: `domain/notifier.ts` holds the `Notifier` contract, which gives the size limit of its messages (`getMessageSizeLimit`) and sends one (`notify`); `infra/` holds `TelegramNotifierApi` (the Telegram bot API) and `telegramNotifier.ts`, implementing the contract on top of it with the `telegramMessageSizeLimit` of the config. A module may import from another module its `domain/` and `infra/`, those of its submodules, and `auth.hooks`, never its `application/` nor its `presentation/` (`backend-modules-isolated` in `.dependency-cruiser.mts`).

The backend `selfReport` module is how the backend reports its own diagnostics. It has `domain/` and `infra/` only (it has no route and no business rule of its own): `domain/` holds the `SelfReport` model (`date`, `message`, `level` (`'warning'` or `'error'`), `reportedFile`, `reportedLine`), which is not derived from `Log`, and the `SelfReportRepository` contract the other parts of the backend report through; `infra/` holds `SelfFileReportRepository` (the contract on top of the `LogsFilesApi` of `logs`, writing each self report as a log line of a `.jsonl` file of `LOGS_DIR_PATH/server/<SERVER_NAME>/log`, so it is read back like any other log), `SessionJobIdApi` (the session file, remembering the last `job_id` the self reports were written with: a repository takes the next one when it is created) and `dto/sessionJobId.dto.ts`. A `SelfFileReportRepository` is created for one file, in `server.ts`: whoever needs to report is given its own `SelfReportRepository` and never names a file. `logs` and `selfReport` import each other, which the rule allows: `logs` the `domain/` of `selfReport`, `selfReport` the `infra/logsFiles.api.ts` and the `infra/dto/rawJsonLog.dto.ts` of `logs`.

The backend `auth` module is not layered yet and follows a flat naming scheme:
- `*.routes.ts` — Fastify route registration + JSON schema (`server.route(...)`)
- `*.controller.ts` — request handlers, calls into the service
- `*.service.ts` — business logic
- `*.schemas.ts` — Fastify `addSchema` definitions used by routes
- `utils/` — pure helper functions, unit-tested independently

Frontend modules split into `infra/` (TanStack Query hooks + query/mutation keys, one file per hook) and `screens/` (the screen component plus its `hooks/`, `layouts/`, `components/`, `utils/`). `shared/` in each workspace holds cross-module code (env parsing, API client setup, i18n, layouts, generic components).

### Environment configuration

Env vars are parsed and validated once at startup, not read ad hoc via `process.env` elsewhere in the code:
- `echo_utilities/src/shared/utils/parseEnv.ts` parses the vars common to both frontend and backend (`EchoEnv`): `SERVER_NAME`, `SERVER_URL`, and `HAS_AUTHENTICATION` are read directly; `API_URL` and `APP_URL` are derived from `SERVER_URL` (`${SERVER_URL}/api` and `${SERVER_URL}/app`) rather than being separate env vars, since the backend serves both the API and the built frontend under one origin.
- `echo_backend/src/shared/config/loadBackConfig.ts` builds the `BackConfig` (`shared/config/backConfig.ts`) from that, the backend-only vars and constants, and throws on startup if required vars are missing/invalid. Each variable is read by its own parser, one per file in `shared/config/utils/` (`parseHttpPort`, `parseTlsConfig`, `parseLogsNotifierConfig`, …): what a variable gives when it is unset, invalid or set to a given value is unit-tested there, while the tests of `loadBackConfig` only cover which env file is loaded, that the error of a parser is thrown, and the whole config compared to the expected one. It loads `.env.production` or `.env.development` based on `NODE_ENV`. `BackConfig` is split by what uses it: `server` (`ServerConfig`: `serverName`, URLs, `host`, `port` (from `HTTP_PORT`), `allowedDomain` (derived from `SERVER_URL`), optional `tls`, `frontendDistDirPath`), `auth` (`AuthConfig`: `hasAuthentication`, cookie config, `usersDbFilePath`), `logs` (`LogsConfig`: `logsDirPath`, `logFileExtension`, and the optional `logsNotifier` (`LogsNotifierConfig`: schedule, watched categories, timezone, last-check file)), `selfReports` (`SelfReportsConfig`: `isEnabled` (from `SELF_REPORTS_ENABLED`), `retentionDays`, the self-reports directory, the names of its files, the session file) and the optional `notification` (`NotificationConfig`: `telegramChatId`, `telegramBaseUrl`, `telegramMessageSizeLimit`).
- Paths and file names are part of the config too (the `data/` directory and its files, the self-reports directory, the `.jsonl` extension of the log files, `parseLogFile.jsonl`): no module builds a path from `import.meta.url` or declares a file name of its own. A function takes the config of its domain (`createLogsFilesApi(config.logs)`, `createFileSessionJobIdApi(config.selfReports)`, `createTelegramNotifierApi(config.notification)`), and a value needed in two places is in both configs (`serverName`). `buildServer` (`server.ts`) receives the `BackConfig` and hands the parts down. Tests get a config from `test/mocks/configs.ts`.
- The frontend fetches its runtime env from a generated `env.<mode>.json` file (see `docker-entrypoint.sh`, which writes `env.production.json` from container env vars at container start — this is how the same built frontend bundle is reconfigured per deployment without rebuilding). In dev, the frontend runs on a different port than the backend (Vite on `:5173` vs the API on `:4000`), so `echo_frontend/vite.config.ts` proxies `/api` to the backend — keeping `SERVER_URL` a single origin (`http://localhost:5173`) in development too.
- `HAS_AUTHENTICATION=false` disables cookie/JWT registration and the `auth` routes entirely (see `echo_backend/src/server.ts`); the frontend must handle both modes.
- The optional Telegram cron (`echo_backend/src/modules/logs/modules/logsNotifier/presentation/logs.notifier.ts`) only registers if `config.logs.logsNotifier` and `config.notification` are set (the first is left out when the second is), that is if `LOGS_NOTIFIER_SCHEDULE_REGEX`, `LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES`, `TELEGRAM_CHAT_ID`, and `TELEGRAM_BASE_URL` are all present and valid; it tracks last-checked time in `data/last_logs_check.json`.

### Log storage and parsing

Logs are read directly from `.jsonl` files on disk (path from `LOGS_DIR_PATH`), not from a database — `infra/logsFiles.api.ts` is the one access to the log files: it walks the directory and reads the lines of each file, and writes the lines of the files the backend stores its own self reports in; `infra/logsFiles.repository.ts` converts each line to a log (`convertRawLogLineToLog` in `infra/dto/rawLogLine.dto.ts`) to implement the `LogsRepository` of `domain/`, and `getFilteredLogs` (`application/getFilteredLogs.ts`) filters them and sorts them from the newest to the oldest, in memory. `filterLogByCategories` / `filterLogBySearch` (in `@echo/utilities`, shared with the frontend) implement the actual filter logic so backend filtering and frontend live-filtering (`echo_frontend/src/modules/logs/infra/__workers__/filterWorker.ts`, a Web Worker) stay in sync.

### Auth

Backend stores users in a local SQLite file at `data/users.db` (`echo_backend/src/modules/auth/users.db.ts`, `better-sqlite3`) with bcrypt-hashed passwords. JWT secret is a fresh random value generated at process start (`crypto.randomBytes` in `server.ts`) — sessions do not survive a server restart. The JWT is delivered via an httpOnly cookie whose domain/security options are derived from `APP_URL` (itself derived from `SERVER_URL`) at startup (`parseAllowedDomain` and `parseCookieSerializeOptions` in `shared/config/utils/`).

### Serving frontend from backend

In production the backend serves the built frontend static files (`echo_frontend/dist`) under `/app` via `@fastify/static`, with a catch-all `notFoundHandler` returning `index.html` for any `/app/*` route (SPA routing) and a JSON 404 for everything else. API routes are mounted under `/api`.

### Swagger / OpenAPI

`@fastify/swagger` + `@fastify/swagger-ui` are registered in `server.ts` and serve live docs at `/documentation`. This is also the source `openApi.json` is exported from — keep route `schema` blocks (especially `operationId`, request/response shapes) accurate, since they drive both the docs and the generated shared types.

## Testing

Vitest is used in all three workspaces with 100% coverage thresholds enforced by `test:coverage` (see each `vitest.config.ts` for exclude lists — generated code, entry points, and `*.db.ts` are excluded). Tests live in `__tests__` (or `__test__`) directories colocated with the code under test.
