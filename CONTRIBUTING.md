# Contributing

Thanks for your interest in Echo. Bug reports, ideas and pull requests are welcome.

## Before you start

- Report a bug with the [bug report form](https://github.com/Br0nie5/echo-server/issues/new/choose), after searching the existing issues.
- Open an issue for anything non-trivial so we can agree on the approach first.
- Read the [architecture overview](docs/architecture.md) and the [development guide](docs/development.md).

## Workflow

1. Fork and create a branch.
2. `npm ci` then `npm run dev`.
3. Make your change with tests. The project enforces **100% coverage**.
4. Run `npm run build && npm run lint && npm run format && npm run arch:check && npm run dead-code:check && npm run test:coverage`, which the CI runs too. The pre-commit hook only runs the format and the lint.
5. Update the documentation (`README.md`, `docs/`), and add an entry to `CHANGELOG.md` under `[Unreleased]` for anything a user can notice.
6. Open a pull request and fill in its template: what changed and why, the issue it closes, how to test it. Its title is a Conventional Commit, like the commits of the repository: `type(scope): summary`.

## Conventions

- Follow the module layout (`domain/` / `application/` / `infra/` / `presentation/`) described in the architecture doc.
- Import shared code from `@echo/utilities`, never from its internal paths.
- Read configuration (settings, paths, file names) through the `BackConfig` built by `loadBackConfig` (`echo_backend/src/shared/config/`), not `process.env` directly. A function takes the config of its domain (`ServerConfig`, `AuthConfig`, `LogsConfig`, `LogsNotifierConfig`, `SelfReportsConfig`, `NotificationConfig`) rather than loose values.
- Never declare by hand a type the API exchanges: change its zod schema in `echo_utilities` (the type and the schema of the route are derived from it).
- Run `npm run arch:check`: it enforces the import boundaries above (no `shared/` → `modules/`, a module importing only the `domain/` and the `infra/` of another one, no cycles).
- Keep filtering logic in `@echo/utilities` so client and server stay identical.
- Invent the data of your tests, mocks and examples: never copy a name, a path or a message from real logs, such as those you put in `test_logs/` or `server_logs/`.
- Keep the README, the documentation comments and the tests of a package about that package only. What links the packages is said in the root `README.md` and in `docs/`.

## Reporting security issues

Please do not open a public issue for vulnerabilities. [Report them privately](https://github.com/Br0nie5/echo-server/security/advisories/new) instead: only the maintainer sees the report.
