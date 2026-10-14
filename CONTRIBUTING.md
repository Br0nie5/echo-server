# Contributing

Thanks for your interest in Echo. Bug reports, ideas and pull requests are welcome.

## Before you start

- **A bug?** Search the existing issues, then use the [bug report form](https://github.com/Br0nie5/echo-server/issues/new/choose).
- **A vulnerability?** Do not open a public issue: [report it privately](https://github.com/Br0nie5/echo-server/security/advisories/new). Only the maintainer sees the report.
- **A change that is not trivial?** Open an issue first, so we agree on the approach before you write it.

Then read the [development guide](docs/development.md), to run the project, and the [architecture](docs/architecture.md), to know where things go.

## Workflow

1. Fork the repository and create a branch.
2. Run `npm ci`, `npx lefthook install`, then `npm run dev`.
3. Make your change, with its tests. The project enforces **100% coverage**.
4. Run the checks, which the CI runs too:

   ```bash
   npm run build && npm run types:check && npm run format && npm run lint && npm run arch:check && npm run dead-code:check && npm run test:coverage
   ```

   The pre-commit hook only runs the format and the lint, and stops the commit when they change a file: stage the fix and commit again.

5. Update the documentation, and add an entry to `CHANGELOG.md` under `[Unreleased]` for anything a user can notice. Start it with `**Breaking:**` when an existing deployment has something to change, and say what.
6. Open a pull request and fill in its template: what changed and why, the issue it closes, how to test it. Its title is a Conventional Commit, like the commits of the repository: `type(scope): summary`.

## Conventions

### Code

- **Layers.** A file of a module is in `domain/`, `application/`, `infra/` or `presentation/`, and imports go one way. `npm run arch:check` enforces it: see [the rules](docs/architecture.md#enforcing-the-architecture).
- **Shared code.** Import it from `@echo/utilities`, never from one of its internal paths. Keep the filtering of the logs there, so the API and the app always filter the same way.
- **Types of the API.** Never declare by hand a type the API exchanges: change its zod schema in `echo_utilities`, which the type and the JSON schema of the route are derived from.
- **Configuration.** The backend reads its settings, its paths and its file names from the `Settings` built by `loadSettings` (`echo_backend/src/initializers/settings/`), never from `process.env`. The settings stay in the composition root. A config (`AuthConfig`, `LogsNotifierConfig`, in `echo_backend/src/shared/config/`) is the part of them a module is given as it is: what its `presentation/` and its `application/` may know. What only an implementation needs (a path, a file name, a token) is not in a config: `infra/` asks for it as named values (`createUsersDb({ usersDbFilePath }, filesService)`). A new variable gets its own parser, no default in the code, and its default for the container in `docker-entrypoint.sh`.
- **Files.** The backend reads and writes files through the `FilesService` only.

### Tests

- What is shared (`echo_utilities`, a `shared/` folder, the `utils/` of the initializers) has thorough unit tests. A screen, a route or the cron has a few integration tests, one per feature, and the pieces of its module are tested through it, with a unit test only for an edge case it does not reach. See [Testing](docs/development.md#testing).
- No test reaches the network, writes a file or depends on the clock.
- Invent the data of your tests, mocks and examples: never copy a name, a path or a message from real logs, such as those you put in `test_logs/` or `self_reports/`.

### Documentation

- Every exported function, type and component has a documentation comment, which the lint requires: a one-sentence summary, then the details, and a code sample for what is used often.
- A package talks about itself only, in its README, its documentation comments and its tests. What links the packages is said in the root `README.md` and in `docs/`.
- What a user reads is in `README.md`, what a variable does in `docs/configuration.md`, the routes in `docs/api.md`, and the `schema` of each route, which the Swagger docs are built from.
