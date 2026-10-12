# Development guide

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Scripts](#scripts)
- [Testing](#testing)
- [Code quality](#code-quality)
- [Docker](#docker)
- [Continuous integration and releases](#continuous-integration-and-releases)

## Prerequisites

- Node.js 24, at the version pinned in [.tool-versions](../.tool-versions) (read by asdf and mise), with the npm it comes with
- Docker, only to build and run the image
- A C++ toolchain and Python, only if `better-sqlite3` has no prebuilt binary for your platform

## Setup

```bash
npm ci
npx lefthook install   # once: installs the pre-commit hook
mkdir -p test_logs     # git-ignored: put some .jsonl files in it, see the README for their format
npm run dev
```

Open **`http://localhost:5173/app`**. `npm run dev` runs three processes together:

| Process   | What it does                                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| utilities | Built once before the others start, then rebuilt at each change (`tsc --watch`), which restarts the backend.                       |
| backend   | The API, on `http://localhost:4000`, restarted at each change (`tsx watch`). Its variables are in `echo_backend/.env.development`. |
| frontend  | The Vite dev server, on `http://localhost:5173`. Its variables are in `echo_frontend/public/env.development.json`.                 |

The Vite dev server serves the app under `/app` and proxies `/api` and `/documentation` to the backend, forwarding the `Host` header as it is. The app and the API therefore share one origin, as they do once deployed, which the CORS check of the backend relies on.

That proxy reaches the backend over HTTP only: leave `TLS_CERT_PATH` and `TLS_KEY_PATH` unset in `.env.development`. To try HTTPS, use `npm start` or one of the HTTPS examples of `npm run start:docker`.

`data/`, at the root, is created on the first run and holds the users database of development. It is git-ignored, like `test_logs/` and `server_logs/`.

The backend and the frontend import `echo_utilities` from its build, `echo_utilities/dist/`. `npm run dev` and `npm run build` build it first: on a fresh clone, run one of them before `npm run lint`, `npm run test:coverage` or `npm run arch:check`.

## Scripts

Run from the root.

| Command                              | Purpose                                                                                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                        | The utilities (watched), the backend and the frontend together.                                                                                             |
| `npm run build`                      | Builds the three workspaces, the utilities first, then type-checks the files at the root. It starts with `npm install`, see below.                          |
| `npm start`                          | Builds, then runs the backend in production mode, serving the built frontend, with `echo_backend/.env.production`.                                          |
| `npm run lint`                       | ESLint, fixing what it can, in every workspace then on the files at the root.                                                                               |
| `npm run format`                     | Prettier, in every workspace then on the files at the root, `docs/` and `examples/`.                                                                        |
| `npm run test:coverage`              | Vitest in every workspace, with a 100% coverage threshold.                                                                                                  |
| `npm run open:coverage`              | Opens the coverage report of each workspace.                                                                                                                |
| `npm run arch:check`                 | The architecture rules, see [Enforcing the architecture](architecture.md#enforcing-the-architecture).                                                       |
| `npm run dead-code:check`            | Unused files, exports and dependencies, with [Knip](https://knip.dev) ([knip.json](../knip.json)).                                                          |
| `npm run vulnerabilities:scan`       | `npm audit`.                                                                                                                                                |
| `npm run start:docker`               | Builds the workspaces and the image, then runs the deployment of [examples/](../examples/) you pick with it.                                                |
| `npm run dns:enable` / `dns:disable` | Makes the hosts of the examples (`testing.cc`, `local.testing.cc`) resolve to this machine, in `/etc/hosts`, or stops doing so. Asks for the sudo password. |
| `npm run certs:generate`             | Creates the self-signed certificate of the examples again, in `certs/`.                                                                                     |
| `npm run deploy:server -- <tag>`     | Builds the image for `amd64` and `arm64` and pushes it to `ghcr.io`, see [releases](#continuous-integration-and-releases).                                  |

Target one workspace with `--workspace=echo_backend` (or `echo_frontend`, `echo_utilities`): `npm run lint --workspace=echo_frontend`.

`npm run build` runs `npm install` first: when `node_modules` is shared between two platforms, macOS and a Linux container for instance, it brings back the packages built for the one running the build.

## Testing

Vitest runs in the three workspaces, with a **100% coverage threshold**. The tests live in `__tests__` folders next to the code they test. Only the entry points and the helpers of the tests are left out of the coverage (see each `vitest.config.ts`, and `vite.config.ts` for the frontend).

```bash
cd echo_backend
npx vitest run src/modules/auth/application/__tests__/signUpFirstAdmin.test.ts   # one file
npm run test:watch
```

No test reaches the outside: no network call, no file written, no real clock when the code reads the date.

### What is tested how

| Subject                                                                                            | Kind of test                                                                                                                    |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| A piece: a util, a parser, a schema, a DTO, an adapter of `infra/`, a use case, a shared component | Unit tests, thorough: every case, as a table where the cases share a shape. This is where the edge cases and the coverage live. |
| A screen of the frontend, a route or the cron of the backend                                       | A few integration tests of the module behind it, each one telling a whole feature. Only what reaches the outside is replaced.   |
| An entry point: the app, the server                                                                | A unit test of what is its own (its config, its routes, what it does when it cannot start), with the modules mocked.            |

### Backend

- **A route or the cron** is tested on the real server (`logs.routes.test.ts`, `auth.routes.test.ts`, `logs.notifier.test.ts`). `buildTestServer` (`src/test/`) builds it with `buildServer`, from a config with the authentication and nothing optional, which a test completes with the part it is about. Only the outside is replaced: the file system by one kept in memory (`createInMemoryFileSystem`), which the real `FilesService` runs on, the users database by an in-memory SQLite one, and `fetch`, stubbed, for the notifications. A test fills the files, sends requests with `server.inject` and reads the files back. The cron is run by moving the fake clock.
- **The server itself** (`src/__tests__/server.test.ts`): its paths, its documentation, its frontend, CORS, the proxies, TLS, and `startServer`, whose `listen` is a stub, so no test opens a port. The routes and the cron are mocked there, so a change in a module never changes that file. The initializers have no test of their own.
- **Everything else** has unit tests, with a `FilesService` whose methods are mocks (`getMockFilesService`) and a config from `src/test/mocks/mockConfigs.ts`.

### Frontend

- **A module is tested through its screen** (`LogsScreen.test.tsx`, `AuthScreen.test.tsx`), with about ten tests for a rich screen and five for a simple one. A snapshot shows what the user sees, for each layout. Every other test is an action of the user: a filter read from the address then changed with its chips, a day opened then closed, a login.
- **Two helpers render the app** at a path, with its real providers and router (`src/test/renderApp.tsx`). `renderFakeRouterApp` is the one a screen test uses: only the screen of that path is real, any other one being an empty box with a test id (`getRouteTestId`), so a test checks where the app navigated without rendering another module nor mocking its requests. `renderRealRouterApp` renders every screen, for the snapshots.
- **Only the network is mocked**, with `nock`: a request that is mocked but never sent fails its test. The Web Worker, which jsdom cannot start, is replaced by its own code run on the thread of the test (`stubFilterWorker`).
- **`src/__tests__/App.test.tsx`** is the unit test of the app itself: its config and its routes, with both screens mocked.
- **`shared/` and the `utils/` folders** have unit tests, a component rendered alone with `renderComponent`, a hook needing the config, the API or the router with `renderAppHook`.
- A test finds a text of the app by its translation key (`appTranslation`), never by the English text. The tests run in UTC and in British English (`vitest.globalSetup.ts`), since the app formats and groups the logs in the time zone and the locale of the user.

### Utilities

Unit tests only, covering every case of each function and schema.

### Test data

Invent the data of a test: `billing`, `send_invoices`, `Quota almost reached`. Nothing that is committed takes a name, a path or a message from real logs, such as those of `test_logs/` or `server_logs/`.

## Code quality

| Tool               | Config                                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prettier           | One config for the whole repository, [prettier.config.js](../prettier.config.js), with the root [.gitignore](../.gitignore) and [.prettierignore](../.prettierignore). |
| ESLint             | One config per workspace. [eslint.config.js](../eslint.config.js), at the root, only covers the files at the root, such as the health check.                           |
| TypeScript         | One `tsconfig.json` per workspace, and one at the root for the files at the root.                                                                                      |
| dependency-cruiser | One `.dependency-cruiser.mts` per workspace.                                                                                                                           |
| Knip               | [knip.json](../knip.json), for the three workspaces at once.                                                                                                           |

**Documentation comments are linted.** Every exported function, interface, type and component of `src/` has a TSDoc comment, whose syntax is checked. `@param` and `@returns` are not required, since the types already say what goes in and out: add them when a parameter or the result has a rule the types do not show.

**The pre-commit hook** ([lefthook.yml](../lefthook.yml)) runs the format, then the lint. It runs neither the build, the tests nor the architecture check: run them yourself before committing.

```bash
npm run build && npm run arch:check && npm run dead-code:check && npm run test:coverage
```

## Docker

```bash
npm run build && docker build -t echo .   # the workspaces, then the image
npm run start:docker                      # both, then one of the examples with that image
npm run start:docker -- proxy-https       # the same, naming the example
```

**The image** ([Dockerfile](../Dockerfile)) is built on `node:24-slim` from the workspaces already built: a first stage installs the production dependencies of the backend, compiling `better-sqlite3`, and the second one copies the result. It runs as the unprivileged `node` user (uid `1000`), creates `/watched_logs`, `/server_logs` and `/app/data`, and starts through the entrypoint.

**The entrypoint** ([docker-entrypoint.sh](../docker-entrypoint.sh)) forces `NODE_ENV` to `production`, refuses a `LOGS_DIR_PATH` or a `SERVER_LOGS_DIR_PATH` that is not the directory the image creates, gives every other variable its default, and writes `env.production.json`, the variables of the frontend, into its build.

**The health check** ([docker-health-check.ts](../docker-health-check.ts)) is run by Node.js as it is, which removes its types itself: it may only use syntax that can be erased (no enum, no namespace). It calls `/api/logs` on `localhost`, at `HTTP_PORT`, over HTTPS only when `TLS_CERT_PATH` is set, without a session nor a date, and takes a `401` (with the authentication) or a `400` (without it, for the missing date) as healthy.

**`npm run start:docker`** ([start_docker.sh](../scripts/start_docker.sh)) lists the directories of [examples/](../examples/), asks which one to run, runs it with the image it just built (`echo:dev`) on `test_logs/`, `server_logs/` and `data/`, and removes its containers on Ctrl+C. An example is a directory holding a `compose.yaml` whose header gives its address (`# URL: …`): add a directory to add one. See the [README of the examples](../examples/README.md) for their hosts and their certificate.

## Continuous integration and releases

**[Test Echo](../.github/workflows/test_echo.yaml)** runs on each pull request to `main`, on each push to it, and once a week, to catch the vulnerabilities published since. It builds, then runs the format and the lint (failing when either changes a file), the architecture check, the dead-code check, the tests and `npm audit`.

**[Deploy Echo](../.github/workflows/deploy_echo.yaml)** runs when a version tag is pushed (`1.2.3`, `1.2.3-rc.1`). It runs the tests, then `npm run deploy:server -- <tag>`.

To release a version:

1. Move the entries of `[Unreleased]` in [CHANGELOG.md](../CHANGELOG.md) under the new version, with its date, and add its link at the bottom of the file.
2. Tag the commit with the version, without a `v`, and push the tag.

`npm run deploy:server -- <tag>` ([deploy_server.sh](../scripts/deploy_server.sh)) can also be run by hand, logged in to `ghcr.io`, with any tag but `latest`:

- A **version** (`1.2.3`, `1.2.3-rc.1`) is published once: the script stops when the registry already has it.
- **Any other tag** (`dev`, `issue-531-this-problem`) is replaced by each deployment.
- **`latest`** is never asked for. A stable version also gets it when it is the highest stable version among the git tags, so releasing a fix for an older line never takes `latest` from a newer one.
