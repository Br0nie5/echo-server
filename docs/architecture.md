# Architecture

Echo is an npm-workspaces monorepo with three packages.

| Package | Role |
| ------- | ---- |
| [echo_backend](../echo_backend) | Fastify API server (TypeScript, ESM). Also serves the built frontend in production. |
| [echo_frontend](../echo_frontend) | React 19 + MUI + TanStack Query single-page app. |
| [echo_utilities](../echo_utilities) | `@echo/utilities`: shared types, env parsing and log-filtering logic. Built to `dist` and consumed by both other packages. |

```
 browser ──► /app/*        static frontend (echo_frontend/dist)
         ──► /api/*        REST API
         ──► /documentation  Swagger UI

 echo_backend ──reads──► LOGS_DIR_PATH/**/*.jsonl
              ──reads/writes──► data/users.db, data/last_logs_check.json
              ──POST──► Telegram Bot API (optional)
```

## Request flow for logs

1. `GET /api/logs?fromDate=…` reaches `presentation/logs.routes.ts`.
2. `presentation/logs.controller.ts` validates params and calls `getFilteredLogs` (`application/getFilteredLogs.ts`).
3. `getFilteredLogs` asks the `LogsRepository` of `domain/` for every log, then filters them and sorts them from the newest to the oldest, in memory.
4. `infra/fileLogs.repository.ts` implements that repository: `infra/fileLogs.api.ts` walks `LOGS_DIR_PATH` and reads the lines of each `.jsonl` file, and the repository converts each line to a log with `convertRawLogLineToLog` (`infra/dto/rawLogLine.dto.ts`).

There is no database for logs. Every request re-reads the files.

The filter functions `filterLogByCategories` and `filterLogBySearch` live in `@echo/utilities` so backend filtering and the frontend's live filtering (a Web Worker, `filterWorker.ts`) behave identically.

## Backend layout

Code is split by domain under `echo_backend/src/modules` (`auth`, `logs`, `notification`).

The core of the `logs` module is split into four layers, each in its own folder:

| Folder | Responsibility | May import |
| ------ | -------------- | ---------- |
| `domain/` | The contracts the module needs from the outside (`LogsRepository`). The models themselves (`Log`, `LogCategory`) come from `@echo/utilities`, since the frontend shares them | nothing from the other layers |
| `application/` | Business logic, one file per use case, named after it (`getFilteredLogs.ts`), which knows nothing of HTTP | `domain/` |
| `infra/` | Implementations of the `domain/` contracts on top of a data source: `*.api.ts` reads it, `dto/` describes what it returns and converts it to models, `*.repository.ts` implements the contract with both | `domain/` |
| `presentation/` | Route registration (`*.routes.ts`), request handlers (`*.controller.ts`), the validation of their input (`utils/`) and the JSON schemas of the routes (`*.schemas.ts`), derived from the zod schemas of `@echo/utilities` | `application/`, `domain/` |

The `auth` module is not layered yet and keeps its files flat, with this naming scheme:

| File | Responsibility |
| ---- | -------------- |
| `*.routes.ts` | Route registration and inline JSON schema |
| `*.controller.ts` | Request handlers |
| `*.service.ts` | Business logic |
| `*.repository.ts` | Data access |
| `*.schemas.ts` | Fastify `addSchema` definitions |
| `utils/` | Pure helpers |

`shared/` holds cross-module code (the config, error schemas). `shared/config/` holds `BackConfig`, split into `ServerConfig`, `AuthConfig`, `LogsConfig` (itself holding `SelfLogsConfig` and the optional `LogsNotifierConfig`) and the optional `NotificationConfig`, and `loadBackConfig`, which builds it once from the environment variables and from constants (the paths under `data/`, the self-logs directory, file names, the extension of the log files). `shared/config/utils/` holds the helpers `loadBackConfig` builds it with, one per file: mostly the parsers the variables are read with. Each function is given the config of its domain and takes every setting and path from it. [server.ts](../echo_backend/src/server.ts) wires everything, registers Swagger, serves `/app` via `@fastify/static` (with an SPA fallback to `index.html`) and returns JSON 404s elsewhere.

The `logs` module itself has three parts: the core log retrieval in the four layer folders described above (the only one with HTTP routes), and two submodules, `modules/logs/modules/selfLog/` (the backend's own diagnostics, see below) and `modules/logs/modules/logsNotifier/` (the cron notifying the problem logs, see below). They depend on each other in one direction only (`selfLog` ← `logs` ← `logsNotifier`), never circularly, except for the format of a log line (`infra/dto/rawJsonLog.dto.ts`), which `selfLog` writes and `logs` reads.

### The `selfLog` submodule

A submodule lives in `modules/<module>/modules/<submodule>/` and follows the layers of its parent, keeping only those it needs. `selfLog` has no route and no business rule of its own, so it has two:

| Folder | Content |
| ------ | ------- |
| `domain/` | `SelfLog`, a diagnostic the backend reports about itself, and `SelfLogRepository`, the contract the other parts of the backend log through |
| `infra/` | `SelfFileLogApi` reads and writes the `.jsonl` files of `LOGS_DIR_PATH/server/<SERVER_NAME>/log`, `SelfFileLogRepository` implements the contract on top of it, `utils/getNextSessionJobId.ts` gives the `job_id` a repository writes its self logs with |

A `SelfFileLogRepository` stores its self logs in one file, given when it is created in [server.ts](../echo_backend/src/server.ts) along with the `SelfLogsConfig` (self-logs directory, retention, session file). Each part of the backend that reports diagnostics receives its own `SelfLogRepository` and never names a file: `FileLogsRepository` does, for the lines it cannot parse (`parseLogFile.jsonl`), and so does the `logsNotifier` submodule, for the problem logs it could not notify (`logsNotifier.jsonl`). When self logs are disabled, or when their directory cannot be prepared, it receives a repository that stores nothing.

### The `logsNotifier` submodule

`logsNotifier` is the optional cron that notifies the problem logs. It has a use case and an entry point of its own, so it has the four layers:

| Folder | Content |
| ------ | ------- |
| `domain/` | `LastCheckDate`, the date the logs were last checked at, and `CheckDateRepository`, the contract it is stored through |
| `application/` | `checkProblemLogsAndNotify`, one check: it notifies the problem logs logged since the previous check, then saves the date of this one; `utils/buildNotifierMessage.ts` writes the message, never longer than the size limit: the logs listed, a footer counting those that do not fit, only their count when none fits, and no message when even that is too long |
| `infra/` | `CheckDateApi` reads and writes the last-check file (`data/last_logs_check.json`), `fileCheckDate.repository.ts` implements the contract on top of it, with `dto/lastCheckDate.dto.ts` (what the file holds) |
| `presentation/` | `logs.notifier.ts`, the Fastify plugin that runs the check on the configured schedule: a cron is the entry point of the submodule, the way a route is the one of `logs` |

The check gets its logs from the `getFilteredLogs` of `logs` (`application/getFilteredLogs.ts`) and sends its message through the `Notifier` of the `notification` module (see below). The very first check only saves its date, so the logs that predate it are not notified, and a check whose notification fails does not save its date, so the next one sends the same logs again. When the size limit of the channel is too small for any message, nothing is sent and the check reports it as a warning through its own `SelfLogRepository` (`logsNotifier.jsonl`). The repositories are built in [server.ts](../echo_backend/src/server.ts), only when both the cron and the notifications are configured (see the [configuration](configuration.md)).

### The `notification` module

`modules/notification/` is how the backend sends a message to the outside. It has no route and no business rule, so it has two layers:

| Folder | Content |
| ------ | ------- |
| `domain/` | `Notifier`, the contract a notification is sent through: it gives the size limit of its messages (`getMessageSizeLimit`) and sends one (`notify`) |
| `infra/` | `TelegramNotifierApi` sends a message through the Telegram bot API, `telegramNotifier.ts` implements the contract on top of it, its size limit being the `telegramMessageSizeLimit` of `NotificationConfig` |

`Notifier` is a contract, so other channels can be added. It is the one thing, with `auth.hooks`, a module may import from another one: `logsNotifier` depends on `notification/domain/`, never on its `infra/`.

## Frontend layout

`echo_frontend/src/modules/<domain>` is split into:

- `infra/`: TanStack Query hooks plus query and mutation keys, one file per hook.
- `screens/`: the screen component and its `hooks/`, `layouts/`, `components/`, `utils/`.

`Initializers/` sets up the API client, env loading and routing. `shared/` holds i18n (English only for now), layouts, theme and generic utilities.

## Type flow

The types of the `auth` requests (`LoginRequest`, `SignUpRequest`, …) and `EchoError` are not written by hand. They are generated from the backend routes:

```
backend route schemas ─► openApi.json ─► orval ─► echo_utilities/**/__generated__ ─► both apps
```

The logs module goes the other way. `Log`, `LogCategory` and `GetLogsParams` (the query of `GET /logs`) are each a [zod](https://zod.dev) schema in `echo_utilities/src/modules/logs/schemas/`, their single source of truth. Everything else is derived from it:

```
                                    ┌─► z.infer ─► the type, used by both apps
echo_utilities/…/schemas/*.schema.ts ┼─► the runtime validation: API answers in the frontend, the query in the backend
                                    └─► z.toJSONSchema ─► echo_backend/…/presentation/logs.schemas.ts ─► route schemas ─► openApi.json
```

Nothing is generated into a file: [logs.schemas.ts](../echo_backend/src/modules/logs/presentation/logs.schemas.ts) converts the zod schemas when the server starts. What a type cannot say is said by the zod schema: `z.int()` for a number without decimals, `.meta({ format: 'date-time' })` for the format of a string. orval is told to leave `Log` and `LogCategory` out (`filters` in [orval.config.ts](../orval.config.ts)), and the `GetLogsParams` it generates is not kept, so there is never a second copy of these types.

`GetLogsParamsSchema` describes the query as the client sends it. The backend validates it with `safeParseGetLogsParams` (`presentation/utils/`), which turns it into what `getFilteredLogs` needs (`fromDate` as a `Date`, `logCategories` always an array).

`npm run generate:types` runs the orval pipeline and refreshes `openApi.json`. **Never edit `__generated__/` files.** Details in the [development guide](development.md).

## Authentication

See the [README](../README.md#authentication) for behavior. Implementation: users live in SQLite (`better-sqlite3`, `users.db.ts`) with bcrypt hashes. The JWT secret is generated with `crypto.randomBytes` at process start, so sessions do not survive restarts. `auth.hooks.ts` provides the `requireAuthentication` pre-handler used by protected routes. With `HAS_AUTHENTICATION=false` the auth plugins and routes are not registered.

## Enforcing the architecture

The conventions above are checked automatically with [dependency-cruiser](https://github.com/sverweij/dependency-cruiser):

```bash
npm run arch:check
```

The script runs `arch:check` in every workspace. Each one has its own rules, with paths relative to the workspace: [echo_backend/.dependency-cruiser.mts](../echo_backend/.dependency-cruiser.mts), [echo_frontend/.dependency-cruiser.mts](../echo_frontend/.dependency-cruiser.mts) and [echo_utilities/.dependency-cruiser.mts](../echo_utilities/.dependency-cruiser.mts). To check a single workspace, run `npm run arch:check --workspace=echo_backend`. They fail on:

| Rule | What it prevents |
| ---- | ---------------- |
| `no-circular` | Any circular dependency |
| `*-shared-not-to-modules` | `shared/` importing from `modules/` (backend and frontend) |
| `backend-modules-isolated` | A backend module importing another module, except `auth/auth.hooks.ts` and `notification/domain/` |
| `frontend-modules-isolated` | A frontend module importing another module |
| `backend-domain-is-independent`, `backend-application-not-to-outer-layers`, `backend-infra-only-to-domain`, `backend-presentation-not-to-infra` | In a layered module, any import other than `presentation → application → domain ← infra` |
| other `backend-*` layering | In a flat module, going upward or skipping layers in `routes → controller → service → repository`; `utils/` and `*.schemas.ts` importing any of those layers |
| `frontend-infra-not-to-screens` | `infra/` importing from `screens/` |
| `utilities-not-to-apps`, `backend-frontend-independent`, `frontend-not-to-backend` | Cross-package imports; apps share code only through `@echo/utilities` |
| `utilities-only-through-barrel`, `generated-only-inside-utilities` | Reaching into `echo_utilities` or `__generated__/` by path |
| `prod-not-to-tests` | Production code importing test files or helpers |

The check covers type-only imports too. To add or relax a rule, edit the config of the workspace it applies to and explain why in the PR. Note that import-graph tooling cannot detect `process.env` reads; that convention is enforced in review.
