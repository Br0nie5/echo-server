<!--
  Thanks for contributing!

  Title: a Conventional Commit, like the commits of the repository: `type(scope): summary`
  (`fix(auth): refuse a login without a password`).
  Anything non-trivial is easier to merge when an issue agreed on the approach first: see CONTRIBUTING.md.
-->

## Description

<!-- What does this change, and why? Describe the behaviour, not the diff. -->

## Related issue

<!-- `Closes #123` closes the issue when the pull request is merged. Write "None" when there is none. -->

Closes #

## Type of change

<!-- Put an `x` in every box that applies. -->

- [ ] ✨ New feature
- [ ] 🐛 Bug fix
- [ ] 💥 Breaking change (an existing deployment has something to change when upgrading)
- [ ] 🧹 Refactor (no change of behaviour)
- [ ] 📝 Documentation
- [ ] 🔧 Build, CI or tooling
- [ ] 📦 Dependencies

## How to test

<!-- The steps a reviewer follows to see the change work, and what you checked by hand (browser, Docker example of `examples/`, reverse proxy…). -->

## Screenshots

<!-- For a change of the web UI: before and after. Delete this section otherwise. -->

## Breaking changes

<!-- What a user has to change when upgrading (environment variable, volume, log file format…). Delete this section otherwise. -->

## Checklist

- [ ] `npm run build`, `npm run types:check`, `npm run lint`, `npm run format`, `npm run arch:check`, `npm run dead-code:check` and `npm run test:coverage` pass (100% coverage)
- [ ] The change is covered by tests
- [ ] The documentation is up to date (`README.md`, `docs/`, the `schema` of the routes for the API docs)
- [ ] `CHANGELOG.md` has an entry under `[Unreleased]` for anything a user can notice
- [ ] The pull request holds this change only
