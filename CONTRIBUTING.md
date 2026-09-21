# Contributing

Thanks for your interest in Echo. Bug reports, ideas and pull requests are welcome.

## Before you start

- Open an issue for anything non-trivial so we can agree on the approach first.
- Read the [architecture overview](docs/architecture.md) and the [development guide](docs/development.md).

## Workflow

1. Fork and create a branch.
2. `npm ci` then `npm run dev`.
3. Make your change with tests. The project enforces **100% coverage**.
4. Run `npm run build && npm run lint && npm run format && npm run arch:check && npm run test:coverage`. The pre-commit hook does the same.
5. Open a pull request describing what changed and why.

## Conventions

- Follow the module layout (`routes` / `controller` / `service` / `repository` / `schemas` / `utils`) described in the architecture doc.
- Import shared code from `@echo/utilities`, never from its internal paths.
- Read configuration through the parsed env objects, not `process.env` directly.
- Never edit files under `__generated__/`. Change the backend route schema and run `npm run generate:types`.
- Run `npm run arch:check`: it enforces the import boundaries above (no `shared/` → `modules/`, no cross-module imports, no cycles).
- Keep filtering logic in `@echo/utilities` so client and server stay identical.

## Reporting security issues

Please do not open a public issue for vulnerabilities. Contact the maintainer privately through their GitHub profile.
