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
npm run generate:types          # regenerate @echo/utilities types from openApi.json via orval (see below)
```

Single test file / watch mode (run inside the relevant workspace dir, e.g. `cd echo_backend`):
```bash
npx vitest run src/modules/logs/logs.service.test.ts
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

Types are **not** hand-written independently in each workspace. The flow is one-directional:

1. Fastify routes in `echo_backend` declare JSON schemas (`*.schemas.ts`) inline in `server.route({ schema: ... })`.
2. `scripts/export_open_api.ts` boots the server and dumps `openApi.json` at the repo root.
3. `orval` (config in `orval.config.ts`) generates TypeScript types from `openApi.json` into a temporary `__generated__/` folder.
4. `scripts/generate_types.sh` moves the relevant generated files into `echo_utilities/src/**/__generated__/`, fixes a known import-extension issue, then lints/formats/builds `echo_utilities`.

Run the whole pipeline with `npm run generate:types` after changing a backend route's request/response schema. Never hand-edit files under `__generated__/`. `echo_utilities/src/index.ts` is the single barrel export — both backend and frontend import everything from `@echo/utilities`, never by reaching into its internal paths.

### Module layout convention (backend and frontend)

Both `echo_backend/src/modules` and `echo_frontend/src/modules` are split by domain (`auth`, `logs`). Backend modules follow a consistent layered naming scheme per module:
- `*.routes.ts` — Fastify route registration + JSON schema (`server.route(...)`)
- `*.controller.ts` — request handlers, calls into the service
- `*.service.ts` — business logic
- `*.schemas.ts` — Fastify `addSchema` definitions used by routes
- `utils/` — pure helper functions, unit-tested independently

Frontend modules split into `infra/` (TanStack Query hooks + query/mutation keys, one file per hook) and `screens/` (the screen component plus its `hooks/`, `layouts/`, `components/`, `utils/`). `shared/` in each workspace holds cross-module code (env parsing, API client setup, i18n, layouts, generic components).

### Environment configuration

Env vars are parsed and validated once at startup, not read ad hoc via `process.env` elsewhere in the code:
- `echo_utilities/src/shared/utils/parseEnv.ts` parses the vars common to both frontend and backend (`EchoEnv`): `SERVER_NAME`, `SERVER_URL`, and `HAS_AUTHENTICATION` are read directly; `API_URL` and `APP_URL` are derived from `SERVER_URL` (`${SERVER_URL}/api` and `${SERVER_URL}/app`) rather than being separate env vars, since the backend serves both the API and the built frontend under one origin.
- `echo_backend/src/shared/utils/parseEchoBackEnv.ts` extends that with backend-only vars (`EchoBackEnv`: `HOST`, `PORT` (from `HTTP_PORT`), `LOGS_DIR_PATH`, `ALLOWED_DOMAIN` (derived from `APP_URL`), cookie config, optional `LOGS_CRON_OPTIONS`) and throws on startup if required vars are missing/invalid. It loads `.env.production` or `.env.development` based on `NODE_ENV`.
- The frontend fetches its runtime env from a generated `env.<mode>.json` file (see `docker-entrypoint.sh`, which writes `env.production.json` from container env vars at container start — this is how the same built frontend bundle is reconfigured per deployment without rebuilding). In dev, the frontend runs on a different port than the backend (Vite on `:5173` vs the API on `:4000`), so `echo_frontend/vite.config.ts` proxies `/api` to the backend — keeping `SERVER_URL` a single origin (`http://localhost:5173`) in development too.
- `HAS_AUTHENTICATION=false` disables cookie/JWT registration and the `auth` routes entirely (see `echo_backend/src/server.ts`); the frontend must handle both modes.
- The optional Telegram cron (`echo_backend/src/modules/logs/cron/logs.cron.ts`) only registers if `LOGS_CRON_SCHEDULE_REGEX`, `LOGS_CRON_WATCHED_LOGS_CATEGORIES`, `LOGS_CRON_TELEGRAM_CHAT_ID`, and `LOGS_CRON_TELEGRAM_BASE_URL` are all present and valid; it tracks last-checked time in `data/last_logs_check.json`.

### Log storage and parsing

Logs are read directly from `.jsonl` files on disk (path from `LOGS_DIR_PATH`), not from a database — `logs.service.ts` walks the directory (`shared/services/files.service.ts`), parses each file (`modules/logs/utils/parseLogFile.ts`), then filters/sorts in memory. `filterLogByCategories` / `filterLogBySearch` (in `@echo/utilities`, shared with the frontend) implement the actual filter logic so backend filtering and frontend live-filtering (`echo_frontend/src/modules/logs/infra/__workers__/filterWorker.ts`, a Web Worker) stay in sync.

### Auth

Backend stores users in a local SQLite file at `data/users.db` (`echo_backend/src/modules/auth/users.db.ts`, `better-sqlite3`) with bcrypt-hashed passwords. JWT secret is a fresh random value generated at process start (`crypto.randomBytes` in `server.ts`) — sessions do not survive a server restart. The JWT is delivered via an httpOnly cookie whose domain/security options are derived from `APP_URL` (itself derived from `SERVER_URL`) at startup (`parseAllowedDomain` in `parseEchoBackEnv.ts`).

### Serving frontend from backend

In production the backend serves the built frontend static files (`echo_frontend/dist`) under `/app` via `@fastify/static`, with a catch-all `notFoundHandler` returning `index.html` for any `/app/*` route (SPA routing) and a JSON 404 for everything else. API routes are mounted under `/api`.

### Swagger / OpenAPI

`@fastify/swagger` + `@fastify/swagger-ui` are registered in `server.ts` and serve live docs at `/documentation`. This is also the source `openApi.json` is exported from — keep route `schema` blocks (especially `operationId`, request/response shapes) accurate, since they drive both the docs and the generated shared types.

## Testing

Vitest is used in all three workspaces with 100% coverage thresholds enforced by `test:coverage` (see each `vitest.config.ts` for exclude lists — generated code, entry points, and `*.db.ts` are excluded). Tests live in `__tests__` (or `__test__`) directories colocated with the code under test.
