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
| `TLS_CERT_PATH`, `TLS_KEY_PATH` | no | Enable HTTPS. Both or neither; `SERVER_URL` must be `https://`; production mode only. |
| `LOGS_NOTIFIER_SCHEDULE_REGEX` | no* | Cron expression ([node-cron](https://github.com/node-cron/node-cron) syntax). |
| `LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES` | no* | Comma-separated subset of `SUCCESS,INFO,WARNING,ERROR`. Invalid entries are dropped. |
| `TELEGRAM_CHAT_ID` | no* | Telegram chat id. |
| `TELEGRAM_BASE_URL` | no* | `https://api.telegram.org/bot<token>`. |
| `LOGS_NOTIFIER_TIMEZONE` | no | Default `UTC`. Timezone the dates of Telegram messages are shown in: a fixed offset (`UTC+2`, `GMT+2`) or an IANA zone (`Europe/Paris`). Throws at startup if unknown. |
| `SELF_REPORTS_ENABLED` | no | `true` or `false`, default `false`. When enabled, `.jsonl` lines the backend fails to parse are written to `LOGS_DIR_PATH/server/<SERVER_NAME>/log/parseLogFile.jsonl`, so they show up in the app like any other log. Requires that path to be writable (see the Volumes section of the [README](../README.md)). |
| `SELF_REPORTS_RETENTION_DAYS` | no | Integer, default `10`. Self-report lines older than this are pruned once at each server start. |

\* The Telegram cron is registered only if **all four** of these variables are present and valid.

The server always binds to `0.0.0.0`.

## Derived cookie settings

The auth cookie is named `<hostname>_access_token`. Its domain and flags come from `SERVER_URL`:

| `SERVER_URL` host | Cookie domain | `secure` |
| ----------------- | ------------- | :------: |
| `localhost` or an IP address | not set | no |
| a hostname, e.g. `echo.example.com` | that hostname | yes |

Other flags are fixed: `httpOnly`, `sameSite=lax`, `path=/`, max age 24 hours. Because `secure` is set for real hostname, browsers will only send the cookie over HTTPS.

## Frontend runtime configuration

The built frontend does not embed configuration. It fetches `env.<mode>.json` at load, and [parseFrontConfig.ts](../echo_frontend/src/shared/config/utils/parseFrontConfig.ts) builds the `FrontConfig` ([frontConfig.ts](../echo_frontend/src/shared/config/frontConfig.ts)) from it: the common variables above, plus the frontend-only ones below. The app shows an error page if one of them is missing or invalid. In Docker, the entrypoint writes `echo_frontend/dist/env.production.json` from the container environment at every start, so one image serves any deployment. In dev, the files in `echo_frontend/public/` are used.

| Variable | Required | Description |
| -------- | :------: | ----------- |
| `LOGS_INITIAL_DATE_DAYS_AGO` | yes | How many days back the logs start when the URL gives no `fromDate`. A positive integer or zero, at most `LOGS_MINIMAL_DATE_DAYS_AGO`. The Docker entrypoint defaults it to `2`. |
| `LOGS_MINIMAL_DATE_DAYS_AGO` | yes | How many days back the start date of the logs can be set at most. A positive integer or zero. The Docker entrypoint defaults it to `14`. |

## Time zone

The backend does not depend on a time zone. Log timestamps are read as UTC unless they carry an offset (see [convertToDate.ts](../echo_backend/src/shared/utils/convertToDate.ts)), and Telegram messages display dates in `LOGS_NOTIFIER_TIMEZONE`, UTC by default (see [buildNotifierMessage.ts](../echo_backend/src/modules/logs/modules/logsNotifier/application/utils/buildNotifierMessage.ts)). The frontend displays dates and groups logs by day in the browser's time zone.
