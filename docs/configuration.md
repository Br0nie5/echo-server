# Configuration reference

Echo is configured entirely through environment variables. They are parsed and validated once at startup; the server refuses to start if a required one is missing or invalid.

## Where variables come from

| Context                | Source |
| ---------------------- | ------ |
| Docker                 | Container environment. [docker-entrypoint.sh](../docker-entrypoint.sh) fills in defaults for anything not set. |
| `npm run dev`          | `echo_backend/.env.development` |
| `npm start` (local prod) | `echo_backend/.env.production` |

Real environment variables always win over `.env.*` files. The file is chosen by `NODE_ENV` (`production` or anything else meaning development).

## Common (frontend and backend)

Parsed by [parseConfig.ts](../echo_utilities/src/shared/config/parseConfig.ts).

| Variable             | Required | Description |
| -------------------- | :------: | ----------- |
| `SERVER_NAME`        | yes | Display name of the instance. |
| `SERVER_URL`         | yes | Public URL of the instance. Must be a valid URL. |
| `HAS_AUTHENTICATION` | yes | `true` or `false`. |

Two values are derived from `SERVER_URL` and are not separate variables:

- `API_URL` = `${SERVER_URL}/api`
- `APP_URL` = `${SERVER_URL}/app`

## Backend only

Parsed by [loadBackConfig.ts](../echo_backend/src/shared/config/loadBackConfig.ts), which builds the `BackConfig` ([backConfig.ts](../echo_backend/src/shared/config/backConfig.ts)) the backend is wired with. Each variable is read by its own parser, in [utils/](../echo_backend/src/shared/config/utils/).

| Variable        | Required | Description |
| --------------- | :------: | ----------- |
| `HTTP_PORT`     | yes | Integer between 1 and 65535. |
| `LOGS_DIR_PATH` | yes | Directory scanned for `.jsonl` files. Relative paths resolve from the backend's working directory. |
| `TLS_CERT_PATH`, `TLS_KEY_PATH` | no | Enable HTTPS. Both or neither; `SERVER_URL` must be `https://`. |
| `LOGS_NOTIFIER_SCHEDULE_REGEX` | no* | Cron expression ([node-cron](https://github.com/node-cron/node-cron) syntax). Throws at startup if invalid while `LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES` names a category. |
| `LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES` | no* | Comma-separated subset of `SUCCESS,INFO,WARNING,ERROR`. Invalid entries are dropped. |
| `TELEGRAM_CHAT_ID` | no* | Telegram chat id. |
| `TELEGRAM_BOT_TOKEN` | no* | Token of the Telegram bot, as given by BotFather (`123456:ABC-DEF…`), without the `https://api.telegram.org/bot` prefix. Treat as a secret. |
| `LOGS_NOTIFIER_TIMEZONE` | no | Default `UTC`. Timezone the dates of Telegram messages are shown in: a fixed offset (`UTC+2`, `GMT+2`) or an IANA zone (`Europe/Paris`). Throws at startup if unknown. |
| `SAVE_SELF_REPORTS_TO_FILE` | no | `true` or `false`, default `false`. When enabled, `.jsonl` lines the backend fails to parse are written to `SERVER_LOGS_DIR_PATH/self_reports/<SERVER_NAME>/log/parseLogFile.jsonl`, and `SERVER_LOGS_DIR_PATH` is scanned next to `LOGS_DIR_PATH`, so they show up in the app like any other log. |
| `SERVER_LOGS_DIR_PATH` | yes | Directory the backend writes its own logs under: the self reports, in its `self_reports` subdirectory, hence writable (see the Volumes section of the [README](../README.md)). Scanned for `.jsonl` files when the self reports are enabled. Relative paths resolve from the backend's working directory. Keep it outside `LOGS_DIR_PATH`, otherwise its files are scanned twice. Always required, but unused when the self reports are disabled. |
| `SELF_REPORTS_RETENTION_DAYS` | no | Integer, default `10`. Self-report lines older than this are pruned once at each server start. Ignored when the self reports are disabled. |

\* The Telegram cron is registered only if **all four** of these variables are present and valid.

The server always binds to `0.0.0.0`.

## Derived cookie settings

The auth cookie is named `<hostname>_access_token`. Its domain and flags come from `SERVER_URL`:

| `SERVER_URL` host | Cookie domain |
| ----------------- | ------------- |
| `localhost` or an IP address | not set |
| a hostname, e.g. `echo.example.com` | its registrable domain, `example.com`, subdomains included |

| `SERVER_URL` scheme | `secure` |
| ------------------- | :------: |
| `https://` | yes: browsers only send the cookie over HTTPS |
| `http://` | no: a browser refuses a secure cookie set over HTTP, so login over HTTP (in development, for instance) keeps working |

Other flags are fixed: `httpOnly`, `sameSite=lax`, `path=/`, max age 24 hours. Use `https://` in `SERVER_URL` for any public deployment, behind a reverse proxy terminating TLS included, since it is the address the browser reaches.

## Derived CORS settings

The API only answers a request carrying an `Origin` header when that origin is one the server serves itself. Which ones are allowed comes from `SERVER_URL` too:

| `SERVER_URL` host | Allowed origins |
| ----------------- | --------------- |
| `localhost` | `localhost`, `127.0.0.1` and `[::1]`, on any port |
| an IP address | that address, on any port |
| a hostname, e.g. `echo.example.com` | its registrable domain (`example.com`) and its subdomains |

Whatever `SERVER_URL` is, the origin a request is itself sent to (same host and port as its `Host` header) is allowed too, so the app keeps working when it is reached at another address than `SERVER_URL`, a LAN IP for instance. Any other origin is refused with an error.

## Frontend runtime configuration

The built frontend does not embed configuration. It fetches `env.<mode>.json` at load, and [parseFrontConfig.ts](../echo_frontend/src/shared/config/utils/parseFrontConfig.ts) builds the `FrontConfig` ([frontConfig.ts](../echo_frontend/src/shared/config/frontConfig.ts)) from it: the common variables above, plus the frontend-only ones below. The app shows an error page if one of them is missing or invalid. In Docker, the entrypoint writes `echo_frontend/dist/env.production.json` from the container environment at every start, so one image serves any deployment. In dev, the files in `echo_frontend/public/` are used.

| Variable | Required | Description |
| -------- | :------: | ----------- |
| `LOGS_INITIAL_DATE_DAYS_AGO` | yes | How many days back the logs start when the URL gives no `fromDate`. A positive integer or zero, at most `LOGS_MINIMAL_DATE_DAYS_AGO`. The Docker entrypoint defaults it to `2`. |
| `LOGS_MINIMAL_DATE_DAYS_AGO` | yes | How many days back the start date of the logs can be set at most. A positive integer or zero. The Docker entrypoint defaults it to `14`. |

## Time zone

The backend does not depend on a time zone. Log timestamps are read as UTC unless they carry an offset (see [convertToDate.ts](../echo_backend/src/shared/utils/convertToDate.ts)), and Telegram messages display dates in `LOGS_NOTIFIER_TIMEZONE`, UTC by default (see [buildNotifierMessage.ts](../echo_backend/src/modules/logs/modules/logsNotifier/application/utils/buildNotifierMessage.ts)). The frontend displays dates and groups logs by day in the browser's time zone.
