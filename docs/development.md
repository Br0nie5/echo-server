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

- Utilities: built first, then rebuilt on every change (`tsc --watch`), which restarts the backend.
- Backend: `http://localhost:4000` (tsx watch)
- Frontend: `http://localhost:5173` (Vite). **Use this URL.** Vite proxies `/api` to the backend so `SERVER_URL` stays a single origin.
- Config: `echo_backend/.env.development` (see [configuration](configuration.md)). Development is HTTP only: the Vite dev server serves the app and proxies the API over HTTP, so the backend refuses to start there when `TLS_CERT_PATH` or `TLS_KEY_PATH` is set. Try HTTPS with `npm start` or `npm run start:docker`.
- `data/` is created on first run and holds the dev SQLite database. It is git-ignored.

Backend and frontend import `echo_utilities` from its build, `echo_utilities/dist/`. `npm run dev` and `npm run build` build it first: on a fresh clone, run one of them before `npm run lint`, `npm run test:coverage` or `npm run arch:check`.

## Scripts

| Command                        | Purpose                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                  | Utilities (watched), backend and frontend together                                                                                    |
| `npm run build`                | Build all workspaces, then type-check the files at the root ([tsconfig.json](../tsconfig.json))                                       |
| `npm start`                    | Build, then run the backend in production mode                                                                                        |
| `npm run lint` / `format`      | ESLint (with fix) / Prettier, in every workspace and on the files at the root                                                         |
| `npm run test:coverage`        | Vitest across workspaces, 100% thresholds                                                                                             |
| `npm run open:coverage`        | Open coverage reports                                                                                                                 |
| `npm run arch:check`           | Architecture rules (import boundaries, cycles), see [architecture](architecture.md#enforcing-the-architecture)                        |
| `npm run dead-code:check`      | Unused files, exports and dependencies across the workspaces, with [Knip](https://knip.dev) (configured in [knip.json](../knip.json)) |
| `npm run vulnerabilities:scan` | `npm audit`                                                                                                                           |
| `npm run start:docker`         | Build the workspaces and the image, then run it on `test_logs/`                                                                       |

Target one workspace with `--workspace=echo_backend` (or `echo_frontend`, `echo_utilities`).

## Testing

Vitest in every workspace with a **100% coverage threshold**. Tests live in `__tests__` folders next to the code. Entry points files are excluded (see each `vitest.config.ts`).

```bash
cd echo_backend
npx vitest run src/modules/logs/application/__tests__/getFilteredLogs.test.ts   # single file
npx vitest --watch
```

## Formatting and linting

One Prettier config, [prettier.config.js](../prettier.config.js) at the root, applies to every workspace, and so do the root [.gitignore](../.gitignore) and [.prettierignore](../.prettierignore). Each workspace has its own ESLint config; [eslint.config.js](../eslint.config.js), at the root, lints the files at the root only, such as the health check.

## Pre-commit hook

[lefthook.yml](../lefthook.yml) runs format then lint. It runs neither the build, the architecture check nor the tests: run them yourself before committing (see the commands above). lefthook is a dev dependency of the root: install the hook once with `npx lefthook install`.

## Docker

```bash
npm run build && docker build -t echo .   # build the workspaces, then the image
npm run start:docker                      # build both, then run the image on test_logs/ with the dev certificates in certs/
```

The image builds on `node:24-slim`, compiles `better-sqlite3` in a first stage, runs as the unprivileged `node` user (uid `1000`), and starts through [docker-entrypoint.sh](../docker-entrypoint.sh), which applies defaults and writes the frontend's runtime env file.

The health check, [docker-health-check.ts](../docker-health-check.ts), is run by Node.js as it is, which removes its types itself: it may only use TypeScript syntax that can be erased (no enum, no namespace). It calls `/api/logs` without a date on `localhost`, at `HTTP_PORT` (`4000` by default), over HTTPS only when `TLS_CERT_PATH` is set, and treats a `401` (authentication enabled) or a `400` (authentication disabled, for the missing date) as healthy.
