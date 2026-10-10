# Contributing

Thanks for your interest in Echo. Bug reports, ideas and pull requests are welcome.

## Before you start

- Open an issue for anything non-trivial so we can agree on the approach first.
- Read the [architecture overview](docs/architecture.md) and the [development guide](docs/development.md).

## Workflow

1. Fork and create a branch.
2. `npm ci` then `npm run dev`.
3. Make your change with tests. The project enforces **100% coverage**.
4. Run `npm run build && npm run lint && npm run format && npm run arch:check && npm run test:coverage`. The pre-commit hook only runs the format and the lint.
5. Open a pull request describing what changed and why.

## Conventions

- Follow the module layout (`domain/` / `application/` / `infra/` / `presentation/`) described in the architecture doc.
- Import shared code from `@echo/utilities`, never from its internal paths.
- Read configuration (settings, paths, file names) through the `BackConfig` built by `loadBackConfig` (`echo_backend/src/shared/config/`), not `process.env` directly. A function takes the config of its domain (`ServerConfig`, `AuthConfig`, `LogsConfig`, `LogsNotifierConfig`, `SelfReportsConfig`, `NotificationConfig`) rather than loose values.
- Never declare by hand a type the API exchanges: change its zod schema in `echo_utilities` (the type and the schema of the route are derived from it).
- Run `npm run arch:check`: it enforces the import boundaries above (no `shared/` → `modules/`, a module importing only the `domain/` and the `infra/` of another one, no cycles).
- Keep filtering logic in `@echo/utilities` so client and server stay identical.

## Reporting security issues

Please do not open a public issue for vulnerabilities. Contact the maintainer privately through their GitHub profile.
