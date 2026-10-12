# Architecture

Echo is an npm-workspaces monorepo of three packages.

| Package                             | Role                                                                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [echo_utilities](../echo_utilities) | `@echo/utilities`: what the two others must agree on. The shapes the API exchanges, the shared configuration, the filtering of the logs. |
| [echo_backend](../echo_backend)     | The server (Fastify, TypeScript, ESM): the API, the cron notifying the problem logs, and the built frontend, which it serves.            |
| [echo_frontend](../echo_frontend)   | The web app (React 19, MUI, TanStack Query), a single-page app.                                                                          |

The backend and the frontend never import each other. Both import `@echo/utilities`, by its name and through its barrel (`src/index.ts`) only, from its build (`dist/`): it is therefore built first.

```
 browser ──► /app/*            the built frontend (echo_frontend/dist)
         ──► /api/*            the REST API
         ──► /documentation    Swagger UI (optional)

 echo_backend ──reads────────► LOGS_DIR_PATH/**/*.jsonl
              ──reads/writes─► SERVER_LOGS_DIR_PATH/self_reports/**/*.jsonl   (optional)
              ──reads/writes─► data/users.db, data/*.json
              ──POST─────────► Telegram bot API                               (optional)
```

- [The life of a logs request](#the-life-of-a-logs-request)
- [Type flow](#type-flow)
- [Backend](#backend)
- [Frontend](#frontend)
- [Serving the frontend at any path](#serving-the-frontend-at-any-path)
- [Enforcing the architecture](#enforcing-the-architecture)

## The life of a logs request

1. The logs screen asks for the logs from a date: `GET /api/logs?fromDate=…`. Only the date goes to the API.
2. `presentation/logs.routes.ts` runs the authentication hook first, when there is one, then validates the query against its JSON schema.
3. `presentation/logs.controller.ts` turns the query into dates and filters (`safeParseGetLogsParams`), and calls the use case, `application/getFilteredLogs.ts`.
4. `getFilteredLogs` asks the `LogsRepository` for every log. `infra/logsFiles.repository.ts` lists the log files, reads their lines and converts each one to a log; a line that holds none becomes a self report.
5. `getFilteredLogs` saves those self reports, then filters the logs and sorts them from the newest to the oldest, in memory.
6. The app filters what it received by level and by search, in a Web Worker, each time the user changes a filter, without asking the API again.

There is no database of logs: every request reads the files again.

Both sides filter with the same two functions of `@echo/utilities`, `filterLogByLevels` and `filterLogBySearch`, so the API and the app always agree on what a filter keeps.

## Type flow

The types the API exchanges are not written by hand, and no file is generated. Each one is a [zod](https://zod.dev) schema in `echo_utilities`, its single source of truth:

| Schemas                                                                                           | Folder                      |
| ------------------------------------------------------------------------------------------------- | --------------------------- |
| `LogSchema`, `LogArraySchema`, `LogLevelSchema`, `GetLogsParamsSchema` (the query of `GET /logs`) | `src/modules/logs/schemas/` |
| `AuthTokenSchema`, `LoginRequestSchema`, `SignUpRequestSchema`                                    | `src/modules/auth/schemas/` |
| `EchoErrorSchema`                                                                                 | `src/shared/schemas/`       |

Everything else is derived from it:

```
                                      ┌─► z.infer ──────────► the type, used by both apps
echo_utilities/…/schemas/*.schema.ts ─┼─► parse / safeParse ─► the validation at runtime
                                      └─► z.toJSONSchema ───► echo_backend/…/*.schemas.ts ─► the routes ─► /documentation
```

- **The type** is inferred, never declared again. What a TypeScript type cannot say is in the schema: `z.int()` for a number without decimals, `.meta({ format: 'date-time' })` for the format of a string.
- **At runtime**, the frontend validates each answer of the API against its schema, and the backend the query of `GET /logs` and the errors it answers.
- **The JSON schemas of the routes** are converted from the zod schemas when the server starts, in the `*.schemas.ts` files of the backend: [logs.schemas.ts](../echo_backend/src/modules/logs/presentation/logs.schemas.ts), [auth.schemas.ts](../echo_backend/src/modules/auth/presentation/auth.schemas.ts) and [errors.schemas.ts](../echo_backend/src/shared/schemas/errors.schemas.ts). To expose another zod schema, add it to the registry of one of them. They validate the requests and are what Swagger documents.

`GetLogsParamsSchema` describes the query as the client sends it. `safeParseGetLogsParams` (`presentation/utils/`) turns it into what `getFilteredLogs` needs: `fromDate` and the optional `toDate` as `Date`s, `logLevels` always an array.

`@echo/utilities` also holds `needsSignupMessage`, the message of the 401 the backend answers the auth check with when no account exists yet: the frontend compares the message of that answer to it, to show the sign-up form instead of the login one.

## Backend

```
echo_backend/src/
  main.ts            the entry point: calls startServer
  server.ts          buildServer, the composition root, and startServer
  initializers/      what buildServer registers on the Fastify app
  modules/
    auth/
    logs/
      modules/logsNotifier/
    selfReport/
  shared/            the config, the services, what the modules share
  test/              the helpers of the tests
```

### Layers

A module is split into layer folders, and keeps only those it needs. Imports go one way: `presentation → application → domain ← infra`.

| Folder          | Holds                                                                                                                                                                                                          | May import                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `domain/`       | The models of the module, and the contracts it needs from the outside: what a storage must do, not how (`*.repository.ts`).                                                                                    | Nothing of the other layers |
| `application/`  | The business rules, one file per use case, named after it. It is given the contracts it works with, and knows nothing of HTTP.                                                                                 | `domain/`                   |
| `infra/`        | What implements the contracts on top of a data source: `*.api.ts` reads and writes it, `dto/*.dto.ts` describes what it holds and converts it to a model, `*.repository.ts` implements the contract with both. | `domain/`                   |
| `presentation/` | The entry points: `*.routes.ts`, `*.controller.ts` (the request handlers, calling `application/`), `*.schemas.ts`, `utils/`. Or a cron, which is an entry point too.                                           | `application/`, `domain/`   |

Neither `domain/` nor `application/` imports a built-in module of Node.js or Fastify: they would run the same on top of anything.

Every file of a module is in one of these folders. A folder that is not a layer would escape the rules about the layers, so [the check](#enforcing-the-architecture) refuses it.

A **submodule** lives in `modules/<module>/modules/<submodule>/` and is layered the same way.

### Between modules

A module or a submodule may import the `domain/` and the `infra/` of any other one, and only its own `infra/` may import the `infra/` of another. Its `application/` and its `presentation/` stay its own, with one exception: the `application/` of a submodule may build on the `application/` of its parent.

### The composition root

`server.ts` is where everything is put together. `buildServer(config, filesService)` creates the Fastify app, builds the repositories and calls the `register*` functions of [initializers/](../echo_backend/src/initializers/), one per file:

| Initializer             | Registers                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `registerSecurity`      | Cookie and JWT support, only with the authentication, and CORS.                                   |
| `registerDocumentation` | Swagger and its UI, only when the config asks for them.                                           |
| `registerAuthRoutes`    | The auth routes and their rate limit, on top of the users database, only with the authentication. |
| `registerLogsRoutes`    | The logs routes, given the authentication hook when there is one.                                 |
| `registerFrontend`      | The built frontend, and the 404 of any unknown path.                                              |
| `registerLogsNotifier`  | The cron, only when it is configured along with the notifications.                                |

They build the `infra/` of the modules and hand it to their `presentation/`, which calls their `application/` itself: an initializer never imports an `application/`. Nothing but `server.ts` imports `initializers/`, and nothing but `main.ts` imports `server.ts`.

`startServer`, next to `buildServer`, creates the `FilesService`, loads the config, builds the server and starts listening. `main.ts` only calls it.

### The config

`shared/config/loadBackConfig.ts` builds the `BackConfig` once, from the environment variables and from constants: the paths, the file names, the limits. It is split by what uses it: `server`, `logs` (which holds the optional `logsNotifier`) and the optional `auth`, `selfReports` and `notification`. A part that is missing is disabled.

A function is given the config of its domain (`createLogsFilesApi(config.logs, filesService)`), and takes every setting, path and file name from it. No module reads `process.env`, builds a path from `import.meta.url` or declares a file name of its own. See the [configuration reference](configuration.md).

### The `logs` module

| Folder          | Content                                                                                                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/`       | `LogsRepository`: it reads the logs of every location it watches (`getAllLogs`) or of one (`getLogs`), stores logs, each at its own `location`, where they replace what was stored (`saveLogs`), and empties a location (`deleteLogs`). |
| `application/`  | `getFilteredLogs`, the one use case.                                                                                                                                                                                                    |
| `infra/`        | `logsFiles.api.ts` lists the log files, reads the lines of one and replaces them. `logsFiles.repository.ts` implements `LogsRepository` on top of it, with the DTOs of `dto/`.                                                          |
| `presentation/` | `GET /logs`.                                                                                                                                                                                                                            |

The models, `Log` and `LogLevel`, come from `@echo/utilities`, since the frontend shares them.

A **location** is an opaque string saying where some logs are stored. Only the implementation gives it a meaning: here the path of a file, elsewhere it could be the address of another server. A `Log` carries its `location` and its `locationName`, the short name shown to the user.

A line of a log file holds neither the `id`, the `contentId`, the `locationName` nor the `groupName` of its log: they are worked out again each time it is read. `createLogWithIds` of `@echo/utilities` creates the two ids. The `contentId` is made of the `location`, the `level`, the `message` and the `origin`, so two logs saying the same thing share it, whatever their date and their job. The `id` adds the date, the job and the position of the line.

### The `logsNotifier` submodule

`modules/logs/modules/logsNotifier/` is the optional cron notifying the problem logs.

| Folder          | Content                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/`       | `LastCheckDate`, when the logs were last checked, and `CheckDateRepository`, the contract it is stored through.                                                           |
| `application/`  | `checkProblemLogsAndNotify`, one check. `utils/buildNotifierMessage.ts` writes the message, never longer than the size limit it is given.                                 |
| `infra/`        | `CheckDateApi` reads and writes the last-check file, `fileCheckDate.repository.ts` implements the contract on top of it.                                                  |
| `presentation/` | `logs.notifier.ts`, the Fastify plugin running the check on the schedule of the config. A cron is the entry point of the submodule, the way a route is the one of `logs`. |

A check builds on `getFilteredLogs`, the use case of its parent:

- It looks at the logs from the date of the previous check to its own, the latter left out. A log is therefore in the period of one check only, and is notified once, even when it is written while the logs are being read.
- The very first check only saves its date, so the logs that predate it are never notified.
- A check whose notification fails does not save its date: the next one sends the same logs again.
- A run that is due while the previous one is still going is skipped.
- The self reports are logs too, notified when their level is watched. A line that holds no valid log is reported with a new date each time the logs are read, so it is notified at every check until its file is fixed. That is on purpose: dating it from when it was first seen would hide a new problem found on the same line.
- When the size limit of the channel is too small for any message, nothing is sent, and the check reports it as a warning to a `SelfReportRepository` of its own.

It sends its message through the `NotifierService` of `shared/services/`.

### The `selfReport` module

`modules/selfReport/` is how the backend reports its own diagnostics. It has no route and no business rule, so it has two layers.

| Folder    | Content                                                                                                                                                                                                                                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/` | `SelfReport`, a diagnostic: its `id`, `date`, `message`, `level` (`'WARNING'` or `'ERROR'`) and `origin`, what it is about, written `path:line:column`, `path:line` or `path`. `SelfReportRepository`, the contract the rest of the backend reports through.                                                            |
| `infra/`  | `selfReport.repository.ts` (`createSelfReportRepository`) creates the repository a part of the backend reports through. `selfLogReport.repository.ts` implements the contract by storing each self report as a log. `noopSelfReport.repository.ts` stores nothing. `SessionJobIdApi` reads and writes the session file. |

A `SelfReport` is a model of its own, not a `Log`. It is **stored** as one, through the `LogsRepository` of `logs`, at a location the logs are read from: that is how it shows up in the app like any other log. `selfReport` therefore knows neither files nor the format of a log line, which `logs/infra` alone describes.

- **One repository per reporter.** Whoever reports is given its own `SelfReportRepository`, created for one location, and never names a file: `getFilteredLogs` reports the lines that hold no log (`parseLogFile.jsonl`), the logs notifier the problem logs it could not notify (`logsNotifier.jsonl`).
- **Without self reports**, that is without a `SelfReportsConfig`, the repository stores nothing, so nobody checks whether they are enabled before reporting.
- **When it is created**, the repository takes the next `jobId` of the session file and stores its location again without the logs older than the retention, which also tells whether the location can be written. Should that fail, the error is logged and the repository stores nothing: an optional feature never stops the server from starting.
- **A self report saved again**, with the `contentId` of a stored one, replaces it: a problem that lasts is stored once, with the date it was last seen at.
- **It never throws.** What cannot be stored goes to the `Logger` of `shared/types/logger.ts`: a diagnostic must not break what was being diagnosed.

`logs` and `selfReport` depend on each other, through contracts only: `logs` imports the `domain/` of `selfReport`, to say what it reports, and `selfReport/infra` the `domain/` of `logs`, to store. The feature itself is circular, the self reports being logs about the reading of the logs.

### The `auth` module

| Folder          | Content                                                                                                                                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/`       | `AuthRepository`, the storage of the accounts: whether one exists (`hasAnyUser`), the creation of one (`createUser`), the check of credentials (`areCredentialsValid`). `SignUpRefusedError`, what a refused sign-up throws. |
| `application/`  | `signUpFirstAdmin.ts`: only the very first user can sign up, and becomes the admin. `validateCredentials.ts`: whether the credentials are those of an account.                                                               |
| `infra/`        | `users.db.ts` opens the SQLite database (`better-sqlite3`), `authUsersDb.repository.ts` implements the contract by querying it, hashing the passwords with bcrypt.                                                           |
| `presentation/` | The four auth routes, their handlers (which sign the JWT and set the session cookie), and `auth.hooks.ts`, `rejectUnauthenticatedRequest`, which answers a 401 to a request without a valid JWT.                             |

- **Two sign-ups never both succeed.** The use case refuses a sign-up while another one is in progress, a flag it checks and sets before any `await`, however long the storage takes to answer.
- **The time of an answer does not tell which usernames exist.** The password of an unknown user is compared to a dummy bcrypt hash, which takes as long as a real comparison.
- **The sign-up and the login are rate limited**, 5 attempts a minute per address, with `@fastify/rate-limit`, registered for these two routes only.
- **No other module imports `auth`.** `registerLogsRoutes` hands `rejectUnauthenticatedRequest` to the logs routes as their `authenticate` option, which they run as their `onRequest` hook: a request without a session gets its 401 before its query is even validated.
- **A session** lasts one day, its cookie and its JWT alike. The JWT is signed with a secret created when the process starts, so the sessions do not survive a restart. See [Session cookie](configuration.md#session-cookie).

### `shared/`

What several modules use. It imports nothing of the backend but itself.

- **`config/`**: the `BackConfig`, `loadBackConfig`, and in `utils/` the parser of each variable.
- **`services/files.service.ts`**: the `FilesService`, the one access of the backend's own code to the file system. Nothing else imports `fs`, the tests included, but its own tests. It creates a directory, reads a file as a whole or as lines (throwing a `FileDoesNotExistError` when it is missing), lists the files of a directory, replaces the content of a file and restricts a file to its owner. A write goes through a temporary file, so a reader never sees a file half written, and the writes of one file are done one after the other. It knows nothing of what the files hold nor of how they are named. `startServer` builds it once and hands it down. Only libraries given a path by the config reach the disk on their own: `better-sqlite3`, `dotenv` and `@fastify/static`.
- **`services/notifier.service.ts`**: the `NotifierService`, how the backend sends a message to the outside. It gives the size limit of its messages and sends one, through the Telegram bot API. It knows nothing of what the messages say: another channel would be chosen inside `createNotifierService`, without changing whoever notifies.
- **`types/logger.ts`**: the `Logger` a part of the backend writes its errors to, so that none depends on the logger of Fastify for it.
- **`schemas/errors.schemas.ts`**: the JSON schema of `EchoError`, which every route may answer.

## Frontend

```
echo_frontend/src/
  main.tsx          the entry point
  App.tsx           the composition root: the router inside the providers
  initializers/     the providers and the routes
  modules/
    auth/
    logs/
  shared/           the config, the API client, the navigation, i18n, components
  test/             the helpers of the tests
```

### Layers

The modules are layered like those of the backend, `domain/` at the center: `presentation/` imports `application/`, and any layer may import `domain/`, which imports none of them and no package, only the models of `@echo/utilities`.

One thing differs: **nothing is injected**. `application/` imports the hook of `infra/` directly, which TanStack Query makes easy, where the backend goes through the contract of `domain/`. The contracts of a frontend `domain/` therefore mostly document what its `infra/` gives.

| Folder          | Holds                                                                          |
| --------------- | ------------------------------------------------------------------------------ |
| `domain/`       | The contract the module needs from the outside, and what it gives and throws.  |
| `infra/`        | The hook giving that contract, on top of the endpoints of the API.             |
| `application/`  | The TanStack Query hooks, one per file. Each query key is written in its hook. |
| `presentation/` | The screen, with its `hooks/`, `layouts/`, `components/` and `utils/`.         |

Only `presentation/` draws and navigates: no other layer imports MUI or React Router. A module never imports another module.

### The `logs` module

- **`domain/`**: `LogsRepository` fetches the logs (`findLogs`) and gives those matching the level and search filters, wherever they are filtered (`filterLogs`).
- **`infra/`**: `useLogsRepository` implements `findLogs` on top of the logs endpoint, validating the answer against `LogArraySchema`, and `filterLogs` on top of the Web Worker below. The worker is one way to filter, which the main thread or the API would be others.
- **`application/`**: `useGetLogs` and `useFilteredLogs`, which is debounced, cancelled when its filters change before it ends, and keeps its previous result until the new one is ready.
- **`presentation/`**: `LogsScreen`. Its filters are read from the query params of the address and written back to them (`useLogsFilters`), and its `utils/` group the logs by day, by group and by job.

The logs are filtered in a **Web Worker**, so typing a search never freezes the page. `infra/workers/` holds both sides of it:

| File                                  | Content                                                                                                                                                                                                                                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filterWorkerMessages.ts`             | The messages the two sides exchange: `setLogs` gives the worker the logs to keep, `filterLogs` asks which of them match, and the answer is their indexes.                                                                                                                                    |
| `filterLogs.ts`                       | The main-thread side, which wraps the worker into a promise-returning function. The worker gets one request at a time, the logs are sent only when they change, and the logs given back are the very objects passed in. The promise rejects when the request is aborted or the worker fails. |
| `createFilterWorkerRequestHandler.ts` | What the worker does with a request: it keeps the logs and filters them.                                                                                                                                                                                                                     |
| `filterWorker.ts`                     | The entry point of the worker, which only passes the messages on.                                                                                                                                                                                                                            |

### The `auth` module

- **`domain/`**: `AuthRepository` (`checkAuthentication`, `login`, `signUp`), with what it gives and throws, `AuthCheckResult` and `InvalidCredentialsError`.
- **`infra/`**: `useAuthRepository`, on top of the auth endpoints. It turns the 401 of the API into the `AuthCheckResult` of the auth check (`login` or `signUp`) and into the `InvalidCredentialsError` of the login, so no layer above it reads an HTTP status or an axios error.
- **`application/`**: `useGetAuthCheck`, and the two mutations, `usePostLogin` and `usePostSignUp`.
- **`presentation/`**: `AuthScreen` shows one of two layouts after the auth check. `AuthFormLayout` is the credentials form, of the login or of the sign-up. `RedirectLayout`, when the user is already authenticated, redirects at once.

Once authenticated, the user goes to the `redirect` query param, only when it is a path of the app (`getRedirectionPathOnAuth`), since anyone can write it in a link, otherwise to the logs screen.

### `shared/` and `initializers/`

`shared/` holds what the modules share, and imports nothing of the rest of `src/`: the config and the API client, each with its context and the hooks reading it (`useConfig`, `useApi`, `useSendApiRequest`), the navigation (`AppPathNames`, `useGoToAuthScreen`), i18n (English only), the theme, generic layouts, components, hooks and utils.

`initializers/` sets them up: `ConfigProvider` loads the config, `ApiProvider` creates the API client, `queryClient` is the TanStack Query client, `AppProviders` nests them in the theme, and `AppRouter` holds the routes. With `App.tsx`, the one file importing them, they are the composition root, which only `main.tsx` imports.

**Navigation.** The app only navigates inside itself, with React Router, whose `basename` is the path of `APP_URL`. When the API answers a 401, the user is not authenticated: `useSendApiRequest` navigates to the auth screen, whatever the request, with the page it was on as the `redirect` query param. It does not on the auth screen itself, where a 401 is the answer the auth endpoints give.

**Configuration.** The app reads its variables from `env.<mode>.json`, fetched when it loads, and where it is reached from the `<base>` of its page (`parseAppUrls`). See [Frontend variables](configuration.md#frontend-variables).

## Serving the frontend at any path

In production, the backend serves the build of the frontend under `/app`, with `@fastify/static`. Any unknown path under `/app` answers `index.html`, for the router of the app to handle it, and any other unknown path a 404 `EchoError`, a path that only starts like `/app` (`/application`) included.

Echo can be reached at any path behind a reverse proxy, `BASE_PATH`, which the proxy may forward or strip:

- **The requests.** The Fastify app is built with a `rewriteUrl` (`removeBasePath`) taking the base path off the requests that carry it, so the routes stay under `/api`, `/app` and `/documentation`.
- **The redirections.** An `onSend` hook puts the `Location` of a redirection to a path of the server below the base path (`addBasePath`), where the browser reaches it.
- **The page.** The frontend is built with relative URLs, and the backend never serves `index.html` as it is: it answers it with a `<base href="<BASE_PATH>/app/">`, which the assets and `env.production.json` resolve against, and which the app reads its own address from.
- **The documentation.** Swagger UI is given the base path as the prefix of its files, and the OpenAPI document as its server.

In development, the Vite dev server serves the app under `/app`, adds the `<base>` itself, and proxies `/api` and `/documentation` to the backend.

## Enforcing the architecture

The conventions above are checked with [dependency-cruiser](https://github.com/sverweij/dependency-cruiser):

```bash
npm run arch:check                            # every workspace
npm run arch:check --workspace=echo_backend   # one of them
```

Each workspace has its own rules, with paths relative to it: [echo_backend/.dependency-cruiser.mts](../echo_backend/.dependency-cruiser.mts), [echo_frontend/.dependency-cruiser.mts](../echo_frontend/.dependency-cruiser.mts) and [echo_utilities/.dependency-cruiser.mts](../echo_utilities/.dependency-cruiser.mts). Each rule says why it exists in its `comment`, which the check prints when it fails.

### Everywhere

| Rule                                 | Refuses                                                                                                                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-circular`                        | A circular dependency.                                                                                                                                           |
| `not-to-unresolvable`                | An import that resolves to no file or package: a typo, a missing dependency.                                                                                     |
| `no-relative-import-outside-package` | A relative import leaving its package. What is outside is either a package, imported by its name, or a file read when the app runs, whose path is in the config. |
| `prod-not-to-tests`                  | Production code importing a test or a test helper.                                                                                                               |

### Between packages

| Rule                                                      | Refuses                                                                                        |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `backend-frontend-independent`, `frontend-not-to-backend` | The backend and the frontend importing each other.                                             |
| `utilities-not-to-apps`                                   | `@echo/utilities` importing one of the apps.                                                   |
| `utilities-only-through-barrel`                           | Reaching into `echo_utilities` other than through its barrel.                                  |
| `utilities-not-to-node`                                   | `@echo/utilities` importing a built-in module of Node.js: the frontend runs it in the browser. |

### Where a file may be

| Rule                                                                      | Refuses                                                                                                                                                          |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend-src-files-in-known-places`, `frontend-src-files-in-known-places` | A file directly under `src/` other than the entry points and the composition root, or in a folder other than `modules/`, `initializers/`, `shared/` and `test/`. |
| `backend-module-files-in-a-layer`, `frontend-module-files-in-a-layer`     | A file of `modules/` outside the `domain/`, `application/`, `infra/` and `presentation/` folders of a module, or of a backend submodule.                         |

The other rules know a file by its folder, hence these two. A rule is about a dependency, so each comes in three forms: the rule itself catches a file by what it imports, `-when-imported` a file importing nothing by what imports it, and `-when-orphan` a file that neither imports nor is imported.

### The composition root and `shared/`

| Rule                                                                                                                    | Refuses                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `backend-shared-is-self-contained`, `frontend-shared-is-self-contained`, `utilities-shared-is-self-contained`           | `shared/` importing anything of `src/` but itself.                                                                                |
| `backend-initializers-only-from-server`, `backend-server-only-from-entry-point`                                         | Anything but `server.ts` importing `initializers/`, and anything but `main.ts` importing `server.ts`.                             |
| `backend-initializers-not-to-application`                                                                               | `initializers/` importing an `application/`.                                                                                      |
| `frontend-initializers-only-from-app`, `frontend-app-only-from-entry-point`, `frontend-entry-point-imported-by-nothing` | Anything but `App.tsx` importing `initializers/`, anything but `main.tsx` importing `App.tsx`, and anything importing `main.tsx`. |
| `backend-fs-only-through-files-service`                                                                                 | Anything but the `FilesService` and its tests importing `fs`.                                                                     |

### Layers and modules

| Rule                                                                                                                                                 | Refuses                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `backend-domain-is-independent`, `backend-application-not-to-outer-layers`, `backend-infra-not-to-upper-layers`, `backend-presentation-not-to-infra` | A backend import other than `presentation → application → domain ← infra`, within a module and across modules.                                                                                   |
| `backend-domain-and-application-not-to-node`, `backend-domain-and-application-not-to-fastify`                                                        | A backend `domain/` or `application/` importing a built-in module of Node.js, Fastify or one of its plugins.                                                                                     |
| `backend-modules-isolated`, `backend-parent-not-to-submodule-internals`, `backend-submodules-isolated`                                               | A backend module or submodule importing anything but the `domain/` and the `infra/` of another one.                                                                                              |
| `backend-submodule-not-to-parent-internals`                                                                                                          | A submodule importing its parent, except its `domain/` and `infra/`, and its `application/` from the `application/` of the submodule.                                                            |
| `frontend-domain-is-independent`, `frontend-infra-only-to-domain`, `frontend-application-not-to-presentation`, `frontend-presentation-not-to-infra`  | Within a frontend module: `domain/` importing another layer, `infra/` importing `application/` or `presentation/`, `application/` importing `presentation/`, `presentation/` importing `infra/`. |
| `frontend-domain-not-to-packages`, `frontend-ui-packages-only-in-presentation`                                                                       | A frontend `domain/` importing a package, and a layer other than `presentation/` importing MUI or React Router.                                                                                  |
| `frontend-modules-isolated`                                                                                                                          | A frontend module importing another module.                                                                                                                                                      |

### What the check covers

The rules about the packages apply to the test files too, which the rules about the layers leave alone. Type-only imports are checked like the others.

Two conventions are out of its reach, and are checked in review: reading `process.env` anywhere but in `loadBackConfig`, and a package talking about another one in its documentation.

dependency-cruiser reads the sources with the `typescript` package, of which it supports the versions below 7, as `typescript-eslint` supports those below 6.1: the three workspaces therefore declare `typescript` `~6.0.3`, the one version the build, the lint and this check all run on.

To add or relax a rule, edit the config of the workspace it applies to, and say why in the pull request.
