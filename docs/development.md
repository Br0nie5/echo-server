# Development guide

## Prerequisites

- Node.js 24 (version pinned in [.tool-versions](../.tool-versions), works with asdf or mise)
- npm (bundled with Node)
- Docker, only for building the image
- A C++ toolchain and Python if `better-sqlite3` has no prebuilt binary for your platform

## Setup

```bash
npm ci
mkdir -p test_logs   # git-ignored; put some .jsonl files in it, see the README for the format
npm run dev
```

- Backend: `http://localhost:4000` (tsx watch)
- Frontend: `http://localhost:5173` (Vite). **Use this URL.** Vite proxies `/api` to the backend so `SERVER_URL` stays a single origin.
- Config: `echo_backend/.env.development` (see [configuration](configuration.md)).
- `data/` is created on first run and holds the dev SQLite database. It is git-ignored.

`echo_utilities` must be built before backend and frontend can type-check against it. `npm run build` handles the order.

## Scripts

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Backend and frontend together |
| `npm run build` | Build all workspaces |
| `npm start` | Build, then run the backend in production mode |
| `npm run lint` / `format` | ESLint (with fix) / Prettier |
| `npm run test:coverage` | Vitest across workspaces, 100% thresholds |
| `npm run open:coverage` | Open coverage reports |
| `npm run arch:check` | Architecture rules (import boundaries, cycles), see [architecture](architecture.md#enforcing-the-architecture) |
| `npm run vulnerabilities:scan` | `npm audit` |
| `npm run generate:types` | Regenerate shared types |
| `npm run build:docker` / `start:docker` | Build the image / build and run it on `test_logs/` |

Target one workspace with `--workspace=echo_backend` (or `echo_frontend`, `echo_utilities`).

## Testing

Vitest in every workspace with a **100% coverage threshold**. Tests live in `__tests__` folders next to the code. Generated code and entry points files are excluded (see each `vitest.config.ts`).

```bash
cd echo_backend
npx vitest run src/modules/logs/logs.service.test.ts   # single file
npx vitest --watch
```

## Regenerating shared types

Run after changing a backend route's request or response schema:

```bash
npm run generate:types
```

This exports `openApi.json` (booting the server), runs orval, moves the results into `echo_utilities/src/**/__generated__/`, then lints, formats and builds `echo_utilities`. Commit `openApi.json` and the regenerated files. The script uses macOS-style `sed -i ''`, so on Linux run it from a macOS machine or adapt that line.

## Pre-commit hook

[lefthook.yml](../lefthook.yml) runs build, format, lint, architecture check, coverage and `npm audit` sequentially. Commits are slow and fail if coverage drops below 100%. Install with `npx lefthook install`.

## Docker

```bash
npm run build:docker    # build workspaces, then the image
npm run start:docker    # run it on test_logs/ with the dev certificates in certs/
```

The image builds on `node:24-slim`, compiles `better-sqlite3` in a first stage, and starts through [docker-entrypoint.sh](../docker-entrypoint.sh), which applies defaults and writes the frontend's runtime env file. A health check ([docker-health-check.js](../docker-health-check.js)) calls `/api/logs` on localhost and treats `400` or `401` as healthy.
