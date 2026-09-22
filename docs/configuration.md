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

Parsed by [parseEnv.ts](../echo_utilities/src/shared/utils/parseEnv.ts).

| Variable             | Required | Description |
| -------------------- | :------: | ----------- |
| `SERVER_NAME`        | yes | Display name of the instance. |
| `SERVER_URL`         | yes | Public URL of the instance. Must be a valid URL. |
| `HAS_AUTHENTICATION` | yes | `true` or `false`. |

Two values are derived from `SERVER_URL` and are not separate variables:

- `API_URL` = `${SERVER_URL}/api`
- `APP_URL` = `${SERVER_URL}/app`

## Backend only

Parsed by [parseEchoBackEnv.ts](../echo_backend/src/shared/utils/parseEchoBackEnv.ts).

| Variable        | Required | Description |
| --------------- | :------: | ----------- |
| `HTTP_PORT`     | yes | Integer between 1 and 65535. |
| `LOGS_DIR_PATH` | yes | Directory scanned for `.jsonl` files. Relative paths resolve from the backend's working directory. |
| `TLS_CERT_PATH`, `TLS_KEY_PATH` | no | Enable HTTPS. Both or neither; `SERVER_URL` must be `https://`; production mode only. |
| `LOGS_CRON_SCHEDULE_REGEX` | no* | Cron expression ([node-cron](https://github.com/node-cron/node-cron) syntax). |
| `LOGS_CRON_WATCHED_LOGS_CATEGORIES` | no* | Comma-separated subset of `SUCCESS,INFO,WARNING,ERROR`. Invalid entries are dropped. |
| `LOGS_CRON_TELEGRAM_CHAT_ID` | no* | Telegram chat id. |
| `LOGS_CRON_TELEGRAM_BASE_URL` | no* | `https://api.telegram.org/bot<token>`. |
| `SELF_LOGS_ENABLED` | no | `true` or `false`, default `false`. When enabled, `.jsonl` lines the backend fails to parse are written to `LOGS_DIR_PATH/server/<SERVER_NAME>/log/parseLogFile.jsonl`, so they show up in the app like any other log. Requires that path to be writable (see the Volumes section of the [README](../README.md)). |
| `SELF_LOGS_RETENTION_DAYS` | no | Integer, default `10`. Self-log lines older than this are pruned once at each server start. |

\* The Telegram cron is registered only if **all four** `LOGS_CRON_*` variables are present and valid.

The server always binds to `0.0.0.0`.

## Derived cookie settings

The auth cookie is named `<hostname>_access_token`. Its domain and flags come from `SERVER_URL`:

| `SERVER_URL` host | Cookie domain | `secure` |
| ----------------- | ------------- | :------: |
| `localhost` or an IP address | not set | no |
| a hostname, e.g. `echo.example.com` | that hostname | yes |

Other flags are fixed: `httpOnly`, `sameSite=lax`, `path=/`, max age 24 hours. Because `secure` is set for real hostnames, browsers will only send the cookie over HTTPS.

## Frontend runtime configuration

The built frontend does not embed configuration. It fetches `env.<mode>.json` at load. In Docker, the entrypoint writes `echo_frontend/dist/env.production.json` from the container environment at every start, so one image serves any deployment. In dev, the files in `echo_frontend/public/` are used.

## Time zone

Log timestamps are parsed as **Europe/Paris** local time and Telegram messages display GMT+2. Both are currently hard-coded (see [convertToDate.ts](../echo_backend/src/shared/utils/convertToDate.ts) and [telegram.notifier.ts](../echo_backend/src/modules/logs/cron/notifications/telegram.notifier.ts)).
