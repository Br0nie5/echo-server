# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-22

### Added

- `selfLogger`: the backend now writes its own diagnostics (log lines it fails to parse) to `.jsonl` files under the logs directory, so parsing failures surface in the UI like any other log instead of being silently dropped.

### Changed

- Reorganized the `logs` module architecture on the backend (cron/notification code moved under `logs/cron`, self-logging code under `logs/selfLogs`).
- Improved backend error handling, including normalizing thrown errors before they're logged or returned.

### Fixed

- Dependabot config no longer tries to update the Docker Node base image to a non-LTS version.

## [1.0.0] - 2026-09-21

Initial release.

[1.1.0]: https://github.com/br0nie5/echo-server/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/br0nie5/echo-server/releases/tag/1.0.0
