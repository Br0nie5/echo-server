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
              ──reads/writes──► SERVER_LOGS_DIR_PATH/**/*.jsonl (optional)
              ──reads/writes──► data/users.db, data/last_logs_check.json
              ──POST──► Telegram Bot API (optional)
```

## Request flow for logs

1. `GET /api/logs?fromDate=…` reaches `presentation/logs.routes.ts`.
2. `presentation/logs.controller.ts` validates params and calls `getFilteredLogs` (`application/getFilteredLogs.ts`).
3. `getFilteredLogs` asks the `LogsRepository` of `domain/` for every log. The repository gives them along with a self report for each stored line that holds no valid log: `getFilteredLogs` saves those to the `SelfReportRepository` it is given, then filters the logs and sorts them from the newest to the oldest, in memory.
4. `infra/logsFiles.repository.ts` implements that repository, whose `getAllLogs` only reads: `infra/logsFiles.api.ts` lists the log files of `LOGS_DIR_PATH`, and of `SERVER_LOGS_DIR_PATH` when the self reports are enabled, and reads the lines of each one, through the [`FilesService`](#the-files-service) of `shared/services/`, and the repository converts each line to a log with `convertRawLogLineToLog` (`infra/dto/rawLogLine.dto.ts`).

There is no database for logs. Every request re-reads the files.

The filter functions `filterLogByCategories` and `filterLogBySearch` live in `@echo/utilities` so backend filtering and the frontend's live filtering (a Web Worker, `filterWorker.ts`) behave identically.

## Backend layout

Code is split by domain under `echo_backend/src/modules` (`auth`, `logs`, `notification`, `selfReport`).

The modules are split into layers, each in its own folder, and keep only those they need. Every file of a module is in one of these folders: any other folder would escape the rules about the layers, so [the check](#enforcing-the-architecture) refuses it. The core of the `logs` module has the four of them:

| Folder | Responsibility | May import |
| ------ | -------------- | ---------- |
| `domain/` | The contracts the module needs from the outside: `LogsRepository` reads the logs of every location it watches (`getAllLogs`), reads those of one location (`getLogs`), stores logs, each at its own `location`, where they replace what was stored (`saveLogs`), and empties a location (`deleteLogs`). A location is an opaque string saying where some logs are stored, which only the implementation gives a meaning to: the path of a file here, the address of another server elsewhere. The models themselves (`Log`, `LogCategory`) come from `@echo/utilities`, since the frontend shares them | nothing from the other layers, no built-in module of Node.js, nor Fastify |
| `application/` | Business logic, one file per use case, named after it (`getFilteredLogs.ts`), which knows nothing of HTTP | `domain/` |
| `infra/` | Implementations of the `domain/` contracts on top of a data source: `*.api.ts` reads it, `dto/` describes what it returns and converts it to models, `*.repository.ts` implements the contract with both | `domain/` |
| `presentation/` | Route registration (`*.routes.ts`), request handlers (`*.controller.ts`), the validation of their input (`utils/`) and the JSON schemas of the routes (`*.schemas.ts`), derived from the zod schemas of `@echo/utilities` | `application/`, `domain/` |

The `auth` module has the four of them too:

| Folder | Content |
| ------ | ------- |
| `domain/` | `AuthRepository`, the contract the accounts are stored through: whether one exists (`hasAnyUser`), the creation of one (`createUser`), the check of credentials (`areCredentialsValid`). It says nothing of who may sign up. `SignUpRefusedError`, what a refused sign up throws |
| `application/` | `signUpFirstAdmin.ts`: only the very first user can sign up, and becomes the admin. `canSignUp` tells whether a user still can, which the auth check asks too. `createSignUpFirstAdmin` builds the use case, which throws a `SignUpRefusedError` when an account already exists or when another sign up is in progress, so two requests sent at the same time never both sign up. `validateCredentials.ts`: whether the credentials are those of an account, which the login handler asks |
| `infra/` | `users.db.ts` (`createUsersDb`) opens the SQLite database, `dto/user.dto.ts` describes a row of its `users` table, `authUsersDb.repository.ts` implements the contract by querying that database, hashing the passwords with bcrypt |
| `presentation/` | `auth.routes.ts`, `auth.controller.ts` (the handlers, calling the use cases, answering a 403 to a `SignUpRefusedError`, signing the JWT and setting the session cookie), `auth.schemas.ts` (the JSON schemas of the routes) and `auth.hooks.ts`, the `authPreHandler` rejecting the requests without a valid JWT, which [registerLogsRoutes.ts](../echo_backend/src/plugins/registerLogsRoutes.ts) hands to the routes to protect as their `preHandler` option |

`shared/` holds cross-module code (the config, error schemas, and `types/logger.ts`, the `Logger` a part of the backend writes its errors to, so that none depends on the logger of Fastify for it). It imports nothing of the backend but itself. `shared/services/` holds what several modules do the same way, the [`FilesService`](#the-files-service). `shared/config/` holds `BackConfig`, split into `ServerConfig`, `AuthConfig`, `LogsConfig` (itself holding the optional `LogsNotifierConfig`), the optional `SelfReportsConfig` and the optional `NotificationConfig`, and `loadBackConfig`, which builds it once from the environment variables and from constants (the paths under `data/`, the self-reports directory, file names, the extension of the log files). `shared/config/utils/` holds the helpers `loadBackConfig` builds it with, one per file: mostly the parsers the variables are read with. Each function is given the config of its domain and takes every setting and path from it. [server.ts](../echo_backend/src/server.ts) wires everything (`buildServer`), with the functions of [plugins/](../echo_backend/src/plugins/), one per file: they register cookie/JWT and CORS, Swagger, the routes of the API under `/api`, `/app` via `@fastify/static` (with an SPA fallback to `index.html`, and JSON 404s elsewhere) and the logs notifier. Together they are the composition root, the one place importing the `infra/` and the `presentation/` of the modules: nothing but `server.ts` imports `plugins/`, and nothing but `main.ts` imports `server.ts`. Its `startServer` builds the server and starts listening, and [main.ts](../echo_backend/src/main.ts), the entry point, only calls it.

The `logs` module itself has two parts: the core log retrieval in the four layer folders described above (the only one with HTTP routes), and a submodule, `modules/logs/modules/logsNotifier/` (the cron notifying the problem logs, see below), which depends on the core and never the other way round.

### The files service

`shared/services/files.service.ts` holds the `FilesService`, which reads and writes the files of the machine as lines of text: `getFilesPaths` (the files of a directory, at any depth), `getFileLines` (the non-blank lines of a file, none when it does not exist), `createDirectory` and `replaceFileLines` (in one step, so a reader never sees the file half written).

It knows nothing of what the files hold nor of how they are named: `getFilesPaths` is given the function saying which files to include, so the extension of the log files stays in the config (`logFileExtension`), like the name of the directory they are put in, which is left out of their group (`logFilesDirName`). `logs/infra` reads and writes the log files through it.

### The `logsNotifier` submodule

A submodule lives in `modules/<module>/modules/<submodule>/` and follows the layers of its parent, keeping only those it needs. It is isolated like a module (see [the rules](#enforcing-the-architecture)): a module or a submodule may import the `domain/` and the `infra/` of any other one, whether it is another module, its parent, one of its submodules or a submodule next to it, and nothing else of it, except that the `application/` of a submodule may build on the use cases of the `application/` of its parent.

`logsNotifier` is the optional cron that notifies the problem logs. It has a use case and an entry point of its own, so it has the four layers:

| Folder | Content |
| ------ | ------- |
| `domain/` | `LastCheckDate`, the date the logs were last checked at, and `CheckDateRepository`, the contract it is stored through |
| `application/` | `checkProblemLogsAndNotify`, one check: it notifies the problem logs logged since the previous check, then saves the date of this one; `utils/buildNotifierMessage.ts` writes the message, never longer than the size limit: the logs listed, a footer counting those that do not fit, only their count when none fits, and no message when even that is too long |
| `infra/` | `CheckDateApi` reads and writes the last-check file (`data/last_logs_check.json`), `fileCheckDate.repository.ts` implements the contract on top of it, with `dto/lastCheckDate.dto.ts` (what the file holds) |
| `presentation/` | `logs.notifier.ts`, the Fastify plugin that runs the check on the configured schedule: a cron is the entry point of the submodule, the way a route is the one of `logs` |

The check gets its logs from the `getFilteredLogs` of `logs` (`application/getFilteredLogs.ts`), which it gives the `SelfReportRepository` of the logs, for the stored lines that hold no valid log, and sends its message through the `Notifier` of the `notification` module (see below). The very first check only saves its date, so the logs that predate it are not notified, and a check whose notification fails does not save its date, so the next one sends the same logs again. When the size limit of the channel is too small for any message, nothing is sent and the check reports it as a warning through its own `SelfReportRepository` (`logsNotifier.jsonl`). The repositories are built in [registerLogsNotifier.ts](../echo_backend/src/plugins/registerLogsNotifier.ts), only when both the cron and the notifications are configured (see the [configuration](configuration.md)).

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
| `domain/` | `SelfReport`, a diagnostic the backend reports about itself (`date`, `message`, `level`, either `'warning'` or `'error'`, `reportedFile`, and `reportedLine`, left out when it points to no line), and `SelfReportRepository`, the contract the other parts of the backend report through |
| `infra/` | `selfLogReport.repository.ts` implements the contract on top of the `LogsRepository` of `logs`, storing each self report as a log. `utils/convertSelfReportToLog.ts` converts one. `SessionJobIdApi` reads and writes the session file, which remembers the last `job_id` the self reports were written with (a repository takes the next one when it is created), `dto/sessionJobId.dto.ts` describes its content |

A `SelfReport` is a model of its own, not a `Log`. The repository stores it as one (the level becomes the category, `reportedFile` the `callFile`, and `reportedLine` the `callLine`, `0` when it is left out; its `location` and `locationName` are those the repository is created with, its `groupName` the `selfReportsGroupName` of the config, which is the name of the server and of the directory the self reports are in), at a location the logs are read from, which is how it shows up in the app like any other log. `selfReport` knows neither files nor the format of a log line: it reads and saves logs through the `LogsRepository`, and `logs/infra` alone describes a line.

When it is created, the repository stores its location again without the logs older than the retention (it empties it when none is left), which also tells whether the location can be written. When a self report is saved again (same `reportedFile`, `reportedLine` and `message`), its stored log is replaced, so a problem that lasts is stored once, with the date it was last seen at. What it cannot store goes to the `Logger` it is given, and never throws.

A repository stores its self reports at one location, given when it is created by [getSelfReportRepository](../echo_backend/src/plugins/utils/getSelfReportRepository.ts), which makes it from the self-reports directory and a file name of the `SelfReportsConfig`, and names it after that file without its extension. Each part of the backend that reports diagnostics receives its own `SelfReportRepository` and never names a file: `getFilteredLogs` does, for the lines the logs repository could not read as logs (`parseLogFile.jsonl`), and so does the `logsNotifier` submodule, for the problem logs it could not notify (`logsNotifier.jsonl`). When self reports are disabled, that is when there is no `SelfReportsConfig`, or when their location cannot be prepared, it receives a repository that stores nothing.

`logs` and `selfReport` depend on each other, through contracts only: `logs` imports the `domain/` of `selfReport`, to say what it reports, and `selfReport/infra` imports the `domain/` of `logs`, to store. The feature itself is circular (the self reports are logs about the reading of the logs); no `infra/` imports another one for it.

## Frontend layout

The modules of `echo_frontend/src/modules` are layered like the backend ones, with imports only going `presentation → application → infra → domain`. Nothing is injected: `application/` imports the hook or the function of `infra/` directly, where the backend goes through the contract of `domain/`.

`modules/logs`:

| Folder | Content |
| ------ | ------- |
| `domain/` | `LogsRepository`, the contract the module needs from the outside: it fetches the logs (`findLogs`) and gives those matching the category and search filters, wherever they are filtered (`filterLogs`). The models (`Log`, `LogCategory`) come from `@echo/utilities` |
| `infra/` | `useLogsRepository`, the hook giving the `LogsRepository`: `findLogs` on top of the logs endpoint (it sends the request, validates the answer against `LogArraySchema` and sends the user to the auth screen on a 401), `filterLogs` on top of the Web Worker of `workers/` (see below). The worker is one way to implement `filterLogs`, which filtering on the main thread or through the API would be others |
| `application/` | The TanStack Query hooks: `useGetLogs` and `useFilteredLogs`, which is debounced, cancelled when its filters change before it ends, and keeps its previous result until the new one is ready |
| `presentation/` | `LogsScreen` and its `hooks/`, `layouts/`, `components/` and `utils/` (the grouping of the logs by day, group and job, the log categories to offer, the `fromDate` query param) |

The logs are filtered in a Web Worker, with the same functions as the backend. `infra/workers/` holds both sides of it:

| File | Content |
| ---- | ------- |
| `filterWorkerMessages.ts` | The messages the two sides exchange: `setLogs` gives the worker the logs to keep, `filterLogs` asks which of them match the filters, and the answer is their indexes |
| `filterLogs.ts` | The main-thread side: it wraps the worker into a promise-returning function. The worker gets one request at a time, so a request aborted while it waits is never sent. The logs are sent only when they are another list, and the answer being indexes, the logs given back are the very objects passed in. The promise rejects when the request is aborted, and when the worker fails, after which every request is rejected |
| `createFilterWorkerRequestHandler.ts` | What the worker does with a request: it keeps the logs and filters them |
| `filterWorker.ts` | The entry point of the worker, which only passes the messages on. It is the one file excluded from the coverage |

`modules/auth`:

| Folder | Content |
| ------ | ------- |
| `domain/` | `AuthRepository`, the contract the backend is reached through (`checkAuthentication`, `login`, `signUp`), and, in the same file, what it gives and throws: `AuthCheckResult` and `InvalidCredentialsError` |
| `infra/` | `useAuthRepository`, the hook giving the `AuthRepository` on top of the auth endpoints: it sends the requests, validates the answers against `AuthTokenSchema` and turns the 401 of the backend into the `AuthCheckResult` of the auth check (`login` or `signUp`) and into the `InvalidCredentialsError` of the login, so that no layer above it reads an HTTP status or an axios error |
| `application/` | The TanStack Query hooks: `useGetAuthCheck`, `usePostLogin` and `usePostSignUp`, the two mutations |
| `presentation/` | `AuthScreen`, which shows one of two layouts after the auth check: `AuthFormLayout`, the credentials form of the login or of the sign up depending on its `formMode` (`useAuthForm` holds its state, submits with the mutation of that mode, alerts the outcome and redirects), or `RedirectLayout`. `hooks/useRedirectionOnAuth.ts` says where to go once authenticated |

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
| `not-to-unresolvable` | An import that resolves to no file or package: a typo or a missing dependency, which no other rule could check |
| `backend-shared-is-self-contained`, `frontend-shared-not-to-modules` | `shared/` importing from `modules/` and, in the backend, from anything else of `src/` |
| `backend-plugins-only-from-server`, `backend-server-only-from-entry-point` | Anything but `server.ts` importing `plugins/`, and anything but `main.ts` importing `server.ts`: the composition root reaches every layer, so a module importing it would too |
| `backend-module-files-in-a-layer` (and its `-when-imported` and `-when-orphan` forms, which catch the files the first cannot) | A file of `modules/` outside the `domain/`, `application/`, `infra/` and `presentation/` folders of a module or of a submodule: the rules about the layers know a file by its folder |
| `backend-modules-isolated`, `backend-parent-not-to-submodule-internals`, `backend-submodules-isolated` | A module or a submodule importing anything but the `domain/` and the `infra/` of another one, whether it is another module, one of its submodules or a submodule next to it |
| `backend-submodule-not-to-parent-internals` | A submodule importing its parent, except its `domain/` and `infra/`, and its `application/` from the `application/` of the submodule |
| `frontend-modules-isolated` | A frontend module importing another module |
| `backend-domain-is-independent`, `backend-application-not-to-outer-layers`, `backend-infra-not-to-upper-layers`, `backend-presentation-not-to-infra` | Any import other than `presentation → application → domain ← infra`, within a module and across modules: only an `infra/` may import the `infra/` of another module or submodule |
| `backend-domain-not-to-node`, `backend-domain-not-to-fastify` | A backend `domain/` importing a built-in module of Node.js (`fs`, `path`, …), Fastify or one of its plugins |
| `frontend-domain-is-independent`, `frontend-infra-only-to-domain`, `frontend-application-not-to-presentation`, `frontend-presentation-not-to-infra` | Any import other than `presentation → application → infra → domain`, within a frontend module |
| `no-relative-import-outside-package` | A relative import leaving its package, whatever it reaches: what is outside is either a package, imported by its name, or a file read when the app runs, whose path is in the config |
| `utilities-not-to-apps`, `backend-frontend-independent`, `frontend-not-to-backend` | Cross-package imports; apps share code only through `@echo/utilities` |
| `utilities-only-through-barrel` | Reaching into `echo_utilities` other than through its barrel |
| `prod-not-to-tests` | Production code importing test files or helpers |

The package boundary rules (`no-relative-import-outside-package`, `utilities-not-to-apps`, `backend-frontend-independent`, `frontend-not-to-backend` and `utilities-only-through-barrel`) apply to the test files too, which the rules about the layers leave alone. The files outside the package are in the graph without being cruised themselves, so an import of one is seen whatever it resolves to.

dependency-cruiser reads the sources with the `typescript` package, of which it supports the versions below 7, as `typescript-eslint` supports those below 6.1: the three workspaces therefore declare `typescript` `~6.0.3`, the one version the build, the lint and this check all run on.

The check covers type-only imports too. To add or relax a rule, edit the config of the workspace it applies to and explain why in the PR. Note that import-graph tooling cannot detect `process.env` reads; that convention is enforced in review.
