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

1. `GET /api/logs?fromDate=…` reaches `logs.routes.ts`.
2. `logs.controller.ts` validates params and calls `logs.service.ts`.
3. The service walks `LOGS_DIR_PATH` (`shared/services/files.service.ts`), parses each file (`utils/parseLogFile.ts`), then filters and sorts in memory.

There is no database for logs. Every request re-reads the files.

The filter functions `filterLogByCategories` and `filterLogBySearch` live in `@echo/utilities` so backend filtering and the frontend's live filtering (a Web Worker, `filterWorker.ts`) behave identically.

## Backend layout

Code is split by domain under `echo_backend/src/modules` (`auth`, `logs`), with a consistent naming scheme:

| File | Responsibility |
| ---- | -------------- |
| `*.routes.ts` | Route registration and inline JSON schema |
| `*.controller.ts` | Request handlers |
| `*.service.ts` | Business logic |
| `*.repository.ts` | Data access |
| `*.schemas.ts` | Fastify `addSchema` definitions |
| `utils/` | Pure helpers |

`shared/` holds cross-module code (env parsing, file service, error schemas). [server.ts](../echo_backend/src/server.ts) wires everything, registers Swagger, serves `/app` via `@fastify/static` (with an SPA fallback to `index.html`) and returns JSON 404s elsewhere.

## Frontend layout

`echo_frontend/src/modules/<domain>` is split into:

- `infra/`: TanStack Query hooks plus query and mutation keys, one file per hook.
- `screens/`: the screen component and its `hooks/`, `layouts/`, `components/`, `utils/`.

`Initializers/` sets up the API client, env loading and routing. `shared/` holds i18n (English only for now), layouts, theme and generic utilities.

## Type flow

Types are not written by hand in each package. The flow is one-directional:

```
backend route schemas ─► openApi.json ─► orval ─► echo_utilities/**/__generated__ ─► both apps
```

`npm run generate:types` runs the pipeline. **Never edit `__generated__/` files.** Details in the [development guide](development.md).

## Authentication

See the [README](../README.md#authentication) for behavior. Implementation: users live in SQLite (`better-sqlite3`, `users.db.ts`) with bcrypt hashes. The JWT secret is generated with `crypto.randomBytes` at process start, so sessions do not survive restarts. `auth.hooks.ts` provides the `requireAuthentication` pre-handler used by protected routes. With `HAS_AUTHENTICATION=false` the auth plugins and routes are not registered.

## Telegram cron

`logs.cron.ts` schedules a job that asks `logs.service` for logs in the watched categories since the last checkpoint (`logs.checkpoint.ts`, stored in `data/last_logs_check.json`) and passes them to a `LogsNotifier` (`notifications/telegram.notifier.ts`). The notifier is an interface, so other channels can be added.

## Enforcing the architecture

The conventions above are checked automatically with [dependency-cruiser](https://github.com/sverweij/dependency-cruiser):

```bash
npm run arch:check
```

Rules live in [.dependency-cruiser.cts](../.dependency-cruiser.cts) and also run in the pre-commit hook. They fail on:

| Rule | What it prevents |
| ---- | ---------------- |
| `no-circular` | Any circular dependency |
| `*-shared-not-to-modules` | `shared/` importing from `modules/` (backend and frontend) |
| `backend-modules-isolated` | A backend module importing another module, except `auth/auth.hooks.ts` |
| `frontend-modules-isolated` | A frontend module importing another module |
| `backend-*` layering | Going upward or skipping layers in `routes → controller → service → repository`; `utils/` and `*.schemas.ts` importing any of those layers |
| `frontend-infra-not-to-screens` | `infra/` importing from `screens/` |
| `utilities-not-to-apps`, `backend-frontend-independent`, `frontend-not-to-backend` | Cross-package imports; apps share code only through `@echo/utilities` |
| `utilities-only-through-barrel`, `generated-only-inside-utilities` | Reaching into `echo_utilities` or `__generated__/` by path |
| `prod-not-to-tests` | Production code importing test files or helpers |

The check covers type-only imports too. To add or relax a rule, edit the config and explain why in the PR. Note that import-graph tooling cannot detect `process.env` reads; that convention is enforced in review.
