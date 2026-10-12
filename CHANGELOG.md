# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `LOGS_INITIAL_DATE_DAYS_AGO` (default `2`) and `LOGS_MINIMAL_DATE_DAYS_AGO` (default `14`) set how many days back the logs start by default in the UI, and how far back their start date can be set.
- Echo can be served under a path of its domain behind a reverse proxy (`BASE_PATH=/echo` for `https://example.com/echo`), whether the proxy forwards that path or strips it. The session cookie is then limited to that path, so two instances served at two paths of one domain keep their own session.
- The container warns in its logs when `NODE_ENV` is set to anything but `production` (it is set back to `production`, as before).
- `TRUSTED_PROXIES` restricts the reverse proxies whose `X-Forwarded-Proto`, `X-Forwarded-Host` and `X-Forwarded-For` headers Echo believes (a list, separated by `;`, of IP addresses, CIDR ranges, `loopback`, `linklocal` and `uniquelocal`). It is optional: by default, Echo believes whatever sends a request, so it works behind any reverse proxy. Once it lists your proxy, the login attempts are limited per client instead of being shared by everyone behind the proxy.
- [examples/](examples/) holds a complete deployment, with its `compose.yaml` and the configuration of its reverse proxy (Caddy), for each common setup: without a proxy, behind an HTTP or an HTTPS proxy, with HTTPS up to Echo, on a subdomain and under a path.

### Changed

- **Breaking:** the documentation of the API (`/documentation`) is no longer served by the container unless `HAS_DOCUMENTATION_ROUTE=true` is set.

- **Breaking:** once `TELEGRAM_CHAT_ID` and `TELEGRAM_BOT_TOKEN` are set, a `LOGS_NOTIFIER_WATCHED_LOGS_LEVELS` naming no valid level stops the container, instead of disabling the notifications.

- **Breaking:** `SERVER_URL` is removed. Echo reads the address it is reached at from each request, so remove the variable from the environment of your container. What it carried is now given as follows:
  - its path, when a reverse proxy serves Echo under one, by `BASE_PATH` (`/echo`);
  - its scheme, by the request: the session cookie is `secure` when Echo serves HTTPS itself, or when a reverse proxy sends `X-Forwarded-Proto: https`;
  - its host, by the request: your reverse proxy must forward the host the browser reached, as the `Host` header (`proxy_set_header Host $http_host;` with nginx) or as `X-Forwarded-Host`, otherwise the login is refused with `Not allowed by CORS`.

- **Breaking:** the session cookie is now named after `SERVER_NAME` (`Echo_echo_access_token` by default) and bound to the host that set it, no longer to its whole domain and its subdomains.

- **Breaking:** `SERVER_NAME` now defaults to `Echo` in the container, instead of `Docker Production`. If you never set it, the self reports are now stored and shown under `Echo`: set `SERVER_NAME=Docker Production` to keep the former name.

- **Breaking:** the container no longer starts when `LOGS_DIR_PATH` or `SERVER_LOGS_DIR_PATH` is set to another path than the directory the image creates for it (`/watched_logs`, `/server_logs`). Remove the variable from the environment of your container and mount your volume on that directory.

- **Breaking:** the directory scripts put their log files in, which is left out of the group names, is now named `logs` instead of `log`. Rename the `log` directories of your watched logs, otherwise `log` becomes part of the group names (`docker_utils_log`). The self reports are now stored in `/server_logs/self_reports/<SERVER_NAME>/logs`: move the files of the former `log` directory there to keep them in the group of the server.

- **Breaking:** the category of a log is now called its level. In the log files, `status` is replaced by `level`, with the same values (`SUCCESS`, `INFO`, `WARNING`, `ERROR`), and `job_id` by `jobId`. A line that still carries `status` or `job_id` is no longer read, so update the scripts writing your logs and the lines they already wrote. In the `Log` returned by `GET /api/logs`, `category` is replaced by `level`, and the `logCategories` query parameter by `logLevels`.

- **Breaking:** `call_file` and `call_line` of a log line are replaced by `origin`, an optional string saying where the line was emitted from, in any form but an empty one (`rotate_logs.sh:12`). A line that still carries `call_file` and `call_line` is read, without them. In the `Log` returned by `GET /api/logs`, `callFile` and `callLine` are replaced by the optional `origin`, a required `contentId` is added, which two logs share when they have the same `location`, `level`, `message` and `origin`, and the `id` is now made of the position of the line, its date, its job and those same four. The `origin` of a self report is the path of the log file followed by the position of the failing line (`/watched_logs/backup/logs/nightly.log.jsonl:3`).

- **Breaking:** the environment variables of the Telegram notifications are renamed. Update the environment of your container:

  | Before                              | After                               |
  | ----------------------------------- | ----------------------------------- |
  | `LOGS_CRON_SCHEDULE_REGEX`          | `LOGS_NOTIFIER_SCHEDULE`            |
  | `LOGS_CRON_WATCHED_LOGS_CATEGORIES` | `LOGS_NOTIFIER_WATCHED_LOGS_LEVELS` |
  | `LOGS_CRON_TELEGRAM_TIMEZONE`       | `LOGS_NOTIFIER_TIMEZONE`            |
  | `LOGS_CRON_TELEGRAM_CHAT_ID`        | `TELEGRAM_CHAT_ID`                  |

- **Breaking:** `LOGS_CRON_TELEGRAM_BASE_URL`, which held the URL of the Telegram bot API with the token of the bot, is replaced by `TELEGRAM_BOT_TOKEN`, which holds the token alone: set it to what followed `https://api.telegram.org/bot` in the former value. Without it, the Telegram notifications are disabled.

- **Breaking:** the self logs are now called self reports, and their environment variables are renamed. Update the environment of your container, otherwise the self reports are disabled and their retention goes back to its default:

  | Before                     | After                         |
  | -------------------------- | ----------------------------- |
  | `SELF_LOGS_ENABLED`        | `SAVE_SELF_REPORTS_TO_FILE`   |
  | `SELF_LOGS_RETENTION_DAYS` | `SELF_REPORTS_RETENTION_DAYS` |

- **Breaking:** the self reports are no longer stored inside the watched logs, in `/watched_logs/server/<SERVER_NAME>/log`, but in a directory of their own, `/server_logs/self_reports/<SERVER_NAME>/logs`, which is scanned along with `/watched_logs` when `SAVE_SELF_REPORTS_TO_FILE=true`. Replace the `/watched_logs/server` sub-mount with a writable `/server_logs` volume (to keep the existing self reports, move the content of the former host directory into a `self_reports` directory of the new one); the `server` directory created in your logs for that sub-mount is no longer needed.

- **Breaking:** an unknown path outside `/app` and `/api` now gets the same error body as the API, `{ "statusCode": 404, "message": "Not found." }`, instead of `{ "error": "Not found" }`.

- The file remembering the last `jobId` of the self reports is renamed from `data/self_logs_session.json` to `data/self_reports_session.json`. Rename it in your `data/` volume to keep the `jobId` going on from the last one, otherwise it starts again at `1`. The format of the self reports themselves does not change.

- **Breaking:** the container runs as the unprivileged `node` user (uid `1000`, gid `1000`) instead of root. The files it wrote as root are no longer writable by it, and `users.db`, which only its owner can read, no longer readable: before upgrading, give the content of your `/app/data` and `/server_logs` volumes to that user, with `sudo chown -R 1000:1000 /path/to/echo/data /path/to/echo/server-logs` for bind mounts, or `docker run --rm -v <volume>:/volume busybox chown -R 1000:1000 /volume` for each named volume. Make the certificate and key of `TLS_CERT_PATH` and `TLS_KEY_PATH` readable by that user too.

### Fixed

- A path that only starts like `/app` (`/application`, `/app-old/…`) now gets a 404 instead of the frontend.
- The group of a log file no longer includes its first directory when `LOGS_DIR_PATH` ends with a `/` or starts with `./`.
- The container health check no longer reports a healthy instance as unhealthy when `SERVER_URL` uses `https://` while a reverse proxy handles TLS, nor when the port of `SERVER_URL` is not the one the server listens on (`-p 8080:4000` with `SERVER_URL=http://host:8080`): it now targets `HTTP_PORT` (`4000` by default), over HTTPS only when `TLS_CERT_PATH` is set.
- A `SERVER_NAME` holding a double quote or a backslash no longer breaks the frontend.

### Security

- A request to `GET /api/logs` without a valid session gets a `401` before its query is validated, instead of the `400` describing what is wrong with its query.
- The API no longer accepts cross-origin requests: only the origin a request is itself sent to is allowed. Before, any website was allowed when `SERVER_URL` was `localhost` or an IP address, and every subdomain of its domain otherwise.

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

[Unreleased]: https://github.com/br0nie5/echo-server/compare/1.2.0...HEAD
[1.2.0]: https://github.com/br0nie5/echo-server/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/br0nie5/echo-server/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/br0nie5/echo-server/releases/tag/1.0.0
