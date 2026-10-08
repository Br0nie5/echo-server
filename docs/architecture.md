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
4. `infra/logsFiles.repository.ts` implements that repository: `infra/logsFiles.api.ts`, the one access to the log files (it also writes the ones the self reports are stored in), walks `LOGS_DIR_PATH` and reads the lines of each `.jsonl` file, and the repository converts each line to a log with `convertRawLogLineToLog` (`infra/dto/rawLogLine.dto.ts`).

There is no database for logs. Every request re-reads the files.

The filter functions `filterLogByCategories` and `filterLogBySearch` live in `@echo/utilities` so backend filtering and the frontend's live filtering (a Web Worker, `filterWorker.ts`) behave identically.

## Backend layout

Code is split by domain under `echo_backend/src/modules` (`auth`, `logs`, `notification`, `selfReport`).

The modules are split into layers, each in its own folder, and keep only those they need. The core of the `logs` module has the four of them:

| Folder | Responsibility | May import |
| ------ | -------------- | ---------- |
| `domain/` | The contracts the module needs from the outside (`LogsRepository`). The models themselves (`Log`, `LogCategory`) come from `@echo/utilities`, since the frontend shares them | nothing from the other layers |
| `application/` | Business logic, one file per use case, named after it (`getFilteredLogs.ts`), which knows nothing of HTTP | `domain/` |
| `infra/` | Implementations of the `domain/` contracts on top of a data source: `*.api.ts` reads it, `dto/` describes what it returns and converts it to models, `*.repository.ts` implements the contract with both | `domain/` |
| `presentation/` | Route registration (`*.routes.ts`), request handlers (`*.controller.ts`), the validation of their input (`utils/`) and the JSON schemas of the routes (`*.schemas.ts`), derived from the zod schemas of `@echo/utilities` | `application/`, `domain/` |

The `auth` module has three of them. It has no use case of its own yet, so no `application/`: its handlers call the contract of `domain/` directly.

| Folder | Content |
| ------ | ------- |
| `domain/` | `AuthRepository`, the contract the accounts are reached through: whether a sign up is needed, the sign up of the first admin, the check of credentials |
| `infra/` | `users.db.ts` (`createUsersDb`) opens the SQLite database, `dto/user.dto.ts` describes a row of its `users` table, `authUsersDb.repository.ts` implements the contract by querying that database, hashing the passwords with bcrypt |
| `presentation/` | `auth.routes.ts`, `auth.controller.ts` (the handlers, signing the JWT and setting the session cookie), `auth.schemas.ts` (the JSON schemas of the routes) and `auth.hooks.ts`, the `authPreHandler` rejecting the requests without a valid JWT, which [registerLogsRoutes.ts](../echo_backend/src/plugins/registerLogsRoutes.ts) hands to the routes to protect as their `preHandler` option |

`shared/` holds cross-module code (the config, error schemas). `shared/config/` holds `BackConfig`, split into `ServerConfig`, `AuthConfig`, `LogsConfig` (itself holding the optional `LogsNotifierConfig`), `SelfReportsConfig` and the optional `NotificationConfig`, and `loadBackConfig`, which builds it once from the environment variables and from constants (the paths under `data/`, the self-reports directory, file names, the extension of the log files). `shared/config/utils/` holds the helpers `loadBackConfig` builds it with, one per file: mostly the parsers the variables are read with. Each function is given the config of its domain and takes every setting and path from it. [server.ts](../echo_backend/src/server.ts) wires everything (`buildServer`), with the functions of [plugins/](../echo_backend/src/plugins/), one per file: they register cookie/JWT and CORS, Swagger, the routes of the API under `/api`, `/app` via `@fastify/static` (with an SPA fallback to `index.html`, and JSON 404s elsewhere) and the logs notifier. Its `startServer` builds the server and starts listening, and [main.ts](../echo_backend/src/main.ts), the entry point, only calls it.

The `logs` module itself has two parts: the core log retrieval in the four layer folders described above (the only one with HTTP routes), and a submodule, `modules/logs/modules/logsNotifier/` (the cron notifying the problem logs, see below), which depends on the core and never the other way round.

### The `logsNotifier` submodule

A submodule lives in `modules/<module>/modules/<submodule>/` and follows the layers of its parent, keeping only those it needs. It is isolated like a module (see [the rules](#enforcing-the-architecture)): its parent and the other submodules only import its `domain/` and its `infra/`, and it only imports theirs, except that its `application/` may build on the use cases of the `application/` of its parent.

`logsNotifier` is the optional cron that notifies the problem logs. It has a use case and an entry point of its own, so it has the four layers:

| Folder | Content |
| ------ | ------- |
| `domain/` | `LastCheckDate`, the date the logs were last checked at, and `CheckDateRepository`, the contract it is stored through |
| `application/` | `checkProblemLogsAndNotify`, one check: it notifies the problem logs logged since the previous check, then saves the date of this one; `utils/buildNotifierMessage.ts` writes the message, never longer than the size limit: the logs listed, a footer counting those that do not fit, only their count when none fits, and no message when even that is too long |
| `infra/` | `CheckDateApi` reads and writes the last-check file (`data/last_logs_check.json`), `fileCheckDate.repository.ts` implements the contract on top of it, with `dto/lastCheckDate.dto.ts` (what the file holds) |
| `presentation/` | `logs.notifier.ts`, the Fastify plugin that runs the check on the configured schedule: a cron is the entry point of the submodule, the way a route is the one of `logs` |

The check gets its logs from the `getFilteredLogs` of `logs` (`application/getFilteredLogs.ts`) and sends its message through the `Notifier` of the `notification` module (see below). The very first check only saves its date, so the logs that predate it are not notified, and a check whose notification fails does not save its date, so the next one sends the same logs again. When the size limit of the channel is too small for any message, nothing is sent and the check reports it as a warning through its own `SelfReportRepository` (`logsNotifier.jsonl`). The repositories are built in [registerLogsNotifier.ts](../echo_backend/src/plugins/registerLogsNotifier.ts), only when both the cron and the notifications are configured (see the [configuration](configuration.md)).

### The `notification` module

`modules/notification/` is how the backend sends a message to the outside. It has no route and no business rule, so it has two layers:

| Folder | Content |
| ------ | ------- |
| `domain/` | `Notifier`, the contract a notification is sent through: it gives the size limit of its messages (`getMessageSizeLimit`) and sends one (`notify`) |
| `infra/` | `TelegramNotifierApi` sends a message through the Telegram bot API, `telegramNotifier.ts` implements the contract on top of it, its size limit being the `telegramMessageSizeLimit` of `NotificationConfig` |

`Notifier` is a contract, so other channels can be added. It is what a module may import from another one: `logsNotifier` depends on `notification/domain/`, never on its `infra/`.

### The `selfReport` module

`modules/selfReport/` is how the backend reports its own diagnostics. It has no route and no business rule, so it has two layers:

| Folder | Content |
| ------ | ------- |
| `domain/` | `SelfReport`, a diagnostic the backend reports about itself (`date`, `message`, `level`, either `'warning'` or `'error'`, `reportedFile`, `reportedLine`), and `SelfReportRepository`, the contract the other parts of the backend report through |
| `infra/` | `SelfFileReportRepository` implements the contract on top of the `LogsFilesApi` of `logs`, reading and writing the `.jsonl` files of `LOGS_DIR_PATH/server/<SERVER_NAME>/log` through it, `SessionJobIdApi` reads and writes the session file, which remembers the last `job_id` the self reports were written with (a repository takes the next one when it is created), `dto/sessionJobId.dto.ts` describes its content |

A `SelfReport` is a model of its own, not a `Log`: the repository writes it as a log line (`utils/convertSelfReportToRawJsonLogLine.ts`), which is how it shows up in the app like any other log.

A `SelfFileReportRepository` stores its self reports in one file, given when it is created by [getSelfReportRepository](../echo_backend/src/plugins/utils/getSelfReportRepository.ts) along with the `SelfReportsConfig` (self-reports directory, retention, session file). Each part of the backend that reports diagnostics receives its own `SelfReportRepository` and never names a file: `LogsFilesRepository` does, for the lines it cannot parse (`parseLogFile.jsonl`), and so does the `logsNotifier` submodule, for the problem logs it could not notify (`logsNotifier.jsonl`). When self reports are disabled, or when their directory cannot be prepared, it receives a repository that stores nothing.

`logs` and `selfReport` import each other, through the two layers a module may import from another one (`domain/` and `infra/`, see `backend-modules-isolated`): `logs` reports through `selfReport/domain/`, and `selfReport` stores its self reports as log lines, with the access to the log files and the format of a log line that `logs` owns (`logs/infra/logsFiles.api.ts`, `logs/infra/dto/rawJsonLog.dto.ts`).

## Frontend layout

`echo_frontend/src/modules/<domain>` is split into:

- `infra/`: TanStack Query hooks plus query and mutation keys, one file per hook.
- `screens/`: the screen component and its `hooks/`, `layouts/`, `components/`, `utils/`.

`Initializers/` sets up the API client, config loading and routing. `shared/` holds i18n (English only for now), layouts, theme and generic utilities.

## Type flow

The types the API exchanges are not written by hand, and no file is generated. Each one is a [zod](https://zod.dev) schema in `echo_utilities`, its single source of truth:

| Schemas | Folder |
| ------- | ------ |
| `LogSchema`, `LogCategorySchema`, `GetLogsParamsSchema` (the query of `GET /logs`) | `src/modules/logs/schemas/` |
| `AuthTokenSchema`, `LoginRequestSchema`, `SignUpRequestSchema` | `src/modules/auth/schemas/` |
| `EchoErrorSchema` | `src/shared/schemas/` |

Everything else is derived from it:

```
                                    ┌─► z.infer ─► the type, used by both apps
echo_utilities/…/schemas/*.schema.ts ┼─► the runtime validation: API answers in the frontend, the query and the thrown errors in the backend
                                    └─► z.toJSONSchema ─► echo_backend/…/*.schemas.ts ─► route schemas ─► /documentation
```

The `*.schemas.ts` files of the backend convert the zod schemas when the server starts: [logs.schemas.ts](../echo_backend/src/modules/logs/presentation/logs.schemas.ts), [auth.schemas.ts](../echo_backend/src/modules/auth/presentation/auth.schemas.ts) and [errors.schemas.ts](../echo_backend/src/shared/schemas/errors.schemas.ts). What a type cannot say is said by the zod schema: `z.int()` for a number without decimals, `.meta({ format: 'date-time' })` for the format of a string.

`GetLogsParamsSchema` describes the query as the client sends it. The backend validates it with `safeParseGetLogsParams` (`presentation/utils/`), which turns it into what `getFilteredLogs` needs (`fromDate` as a `Date`, `logCategories` always an array).

## Authentication

See the [README](../README.md#authentication) for behavior. Implementation: users live in SQLite (`better-sqlite3`, `infra/users.db.ts`) with bcrypt hashes. The JWT secret is generated with `crypto.randomBytes` at process start, so sessions do not survive restarts. `presentation/auth.hooks.ts` provides the `authPreHandler`, which `plugins/registerLogsRoutes.ts` gives to the protected routes as their `preHandler`: the other modules do not import it. With `HAS_AUTHENTICATION=false` the auth plugins and routes are not registered.

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
| `backend-modules-isolated` | A backend module importing another module, except its `domain/` and `infra/`, and those of its submodules |
| `backend-parent-not-to-submodule-internals`, `backend-submodules-isolated` | A module importing one of its submodules, or a submodule importing another one, except its `domain/` and `infra/` |
| `backend-submodule-not-to-parent-internals` | A submodule importing its parent, except its `domain/` and `infra/`, and its `application/` from the `application/` of the submodule |
| `frontend-modules-isolated` | A frontend module importing another module |
| `backend-domain-is-independent`, `backend-application-not-to-outer-layers`, `backend-infra-only-to-domain`, `backend-presentation-not-to-infra` | Any import other than `presentation → application → domain ← infra`, within a module and across modules: only an `infra/` may import the `infra/` of another module or submodule |
| `frontend-infra-not-to-screens` | `infra/` importing from `screens/` |
| `utilities-not-to-apps`, `backend-frontend-independent`, `frontend-not-to-backend` | Cross-package imports; apps share code only through `@echo/utilities` |
| `utilities-only-through-barrel` | Reaching into `echo_utilities` by path |
| `prod-not-to-tests` | Production code importing test files or helpers |

The check covers type-only imports too. To add or relax a rule, edit the config of the workspace it applies to and explain why in the PR. Note that import-graph tooling cannot detect `process.env` reads; that convention is enforced in review.
