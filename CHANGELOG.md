# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Breaking:** log timestamps must now be ISO 8601 (e.g. `2026-09-19T14:41:09.669Z`, from `date -u +'%Y-%m-%dT%H:%M:%S.%3NZ'`), read as UTC when they carry no offset. The former `yyyy-MM-dd HH:mm:ss.SSS` format, read as Europe/Paris time, is no longer supported: such lines are skipped like any unparsable line.
- Self-logs are written with ISO 8601 UTC timestamps.
- Telegram messages show dates in UTC by default instead of a fixed GMT+2.

### Added

- Optional `LOGS_CRON_TELEGRAM_TIMEZONE` env var to show the dates of Telegram messages in another timezone: a fixed offset (`UTC+2`, `GMT+2`) or an IANA zone (`Europe/Paris`).

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
