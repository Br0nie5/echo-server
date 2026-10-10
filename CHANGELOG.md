# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `LOGS_INITIAL_DATE_DAYS_AGO` (default `2`) and `LOGS_MINIMAL_DATE_DAYS_AGO` (default `14`) set how many days back the logs start by default in the UI, and how far back their start date can be set.

### Changed

- **Breaking:** the environment variables of the Telegram notifications are renamed. Update the environment of your container:

  | Before | After |
  | ------ | ----- |
  | `LOGS_CRON_SCHEDULE_REGEX` | `LOGS_NOTIFIER_SCHEDULE_REGEX` |
  | `LOGS_CRON_WATCHED_LOGS_CATEGORIES` | `LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES` |
  | `LOGS_CRON_TELEGRAM_TIMEZONE` | `LOGS_NOTIFIER_TIMEZONE` |
  | `LOGS_CRON_TELEGRAM_CHAT_ID` | `TELEGRAM_CHAT_ID` |

- **Breaking:** `LOGS_CRON_TELEGRAM_BASE_URL`, which held the URL of the Telegram bot API with the token of the bot, is replaced by `TELEGRAM_BOT_TOKEN`, which holds the token alone: set it to what followed `https://api.telegram.org/bot` in the former value. Without it, the Telegram notifications are disabled.

- **Breaking:** the self logs are now called self reports, and their environment variables are renamed. Update the environment of your container, otherwise the self reports are disabled and their retention goes back to its default:

  | Before | After |
  | ------ | ----- |
  | `SELF_LOGS_ENABLED` | `SAVE_SELF_REPORTS_TO_FILE` |
  | `SELF_LOGS_RETENTION_DAYS` | `SELF_REPORTS_RETENTION_DAYS` |

- **Breaking:** the self reports are no longer stored inside the watched logs, in `/watched_logs/server/<SERVER_NAME>/log`, but in a directory of their own, `/server_logs/self_reports/<SERVER_NAME>/log` (under `SERVER_LOGS_DIR_PATH`, default `/server_logs`), which is scanned along with `/watched_logs` when `SAVE_SELF_REPORTS_TO_FILE=true`. Replace the `/watched_logs/server` sub-mount with a writable `/server_logs` volume (to keep the existing self reports, move the content of the former host directory into a `self_reports` directory of the new one); the `server` directory created in your logs for that sub-mount is no longer needed.

- **Breaking:** an unknown path outside `/app` and `/api` now gets the same error body as the API, `{ "statusCode": 404, "message": "Not found." }`, instead of `{ "error": "Not found" }`.

- The file remembering the last `job_id` of the self reports is renamed from `data/self_logs_session.json` to `data/self_reports_session.json`. Rename it in your `data/` volume to keep the `job_id` going on from the last one, otherwise it starts again at `1`. The format of the self reports themselves does not change.

### Fixed

- A path that only starts like `/app` (`/application`, `/app-old/…`) now gets a 404 instead of the frontend.
- The group of a log file no longer includes its first directory when `LOGS_DIR_PATH` ends with a `/` or starts with `./`.

### Security

- When `SERVER_URL` is `localhost` or an IP address, the API no longer accepts cross-origin requests from any website: only `localhost` and the loopback addresses, or that IP address, are allowed. The address a request is itself sent to stays allowed, so an instance reached at another address than `SERVER_URL` keeps working.

## [1.2.0] - 2026-09-23

### Changed

- **Breaking:** every log line must now carry `call_file` (string, the file that emitted it, e.g. `rotate_logs.sh`) and `call_line` (integer, the line in that file). Lines missing either field are skipped like any unparsable line. `callFile` and `callLine` are now required in the `Log` returned by `GET /api/logs`.
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

[1.2.0]: https://github.com/br0nie5/echo-server/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/br0nie5/echo-server/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/br0nie5/echo-server/releases/tag/1.0.0
